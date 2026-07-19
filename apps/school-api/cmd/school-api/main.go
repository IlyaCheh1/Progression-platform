package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/masterofsword/contracts/engines"
	"github.com/masterofsword/contracts/rbac"
	"github.com/masterofsword/school-api/internal/admincontent"
	"github.com/masterofsword/school-api/internal/authz"
	"github.com/masterofsword/school-api/internal/seed"
)

// Shared in-process platform for local modular monolith slice.
// Production: school-api publishes events; platform-worker consumes.
var platform = engines.NewPlatform()
var contentStore *admincontent.Store

func main() {
	root := seed.FindRoot()
	seed.MustLoad(platform)
	contentStore = admincontent.MustLoad(root)

	// Default loopback-only: temporary local auth must not be exposed on LAN.
	addr := env("SCHOOL_API_ADDR", "127.0.0.1:8082")
	mux := http.NewServeMux()
	var mu sync.Mutex

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, map[string]any{"ok": true, "service": "school-api"})
	})

	mux.HandleFunc("GET /v1/students", authz.RequirePermission(platform, rbac.PermSchoolRead, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		writeJSON(w, publicStudents(platform.ListStudents()))
	}))

	mux.HandleFunc("GET /v1/students/{id}", func(w http.ResponseWriter, r *http.Request) {
		s, ok := platform.GetStudent(r.PathValue("id"))
		if !ok {
			http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
			return
		}
		cp := *s
		cp.Password = ""
		writeJSON(w, cp)
	})

	mux.HandleFunc("GET /v1/profile/me", authz.RequireAuth(platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		view, err := platform.ProfileForStudent(actor.ID)
		if err != nil {
			http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
			return
		}
		writeJSON(w, view)
	}))

	mux.HandleFunc("PUT /v1/profile/me", authz.RequireAuth(platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		var body engines.ProfileInput
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		view, err := platform.UpdateStudentProfile(actor.ID, body)
		if err != nil {
			status := http.StatusBadRequest
			if err.Error() == "student not found" {
				status = http.StatusNotFound
			}
			http.Error(w, `{"error":"`+err.Error()+`"}`, status)
			return
		}
		writeJSON(w, view)
	}))

	mux.HandleFunc("GET /v1/inventory/me", authz.RequireAuth(platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		view, err := platform.InventoryForStudent(actor.ID)
		if err != nil {
			http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
			return
		}
		writeJSON(w, view)
	}))

	mux.HandleFunc("PUT /v1/inventory/equip", authz.RequireAuth(platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		var body engines.EquipInventoryInput
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		view, err := platform.EquipInventoryItem(actor.ID, body)
		if err != nil {
			status := http.StatusBadRequest
			if err.Error() == "student not found" {
				status = http.StatusNotFound
			}
			http.Error(w, `{"error":"`+err.Error()+`"}`, status)
			return
		}
		writeJSON(w, view)
	}))

	mux.HandleFunc("POST /v1/auth/login", func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Login    string `json:"login"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		s, ok := platform.Authenticate(body.Login, body.Password)
		if !ok {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}
		token, err := platform.IssueAccessToken(s.ID)
		if err != nil {
			http.Error(w, `{"error":"token_issue_failed"}`, http.StatusInternalServerError)
			return
		}
		public := *s
		public.Password = ""
		writeJSON(w, map[string]any{
			"accessToken": token,
			"role":        s.NormalizedRole(),
			"roles":       s.RolesList(),
			"permissions": permissionListForRoles(s.RolesList()),
			"student":     public,
		})
	})

	mux.HandleFunc("GET /v1/admin/students", authz.RequirePermission(platform, rbac.PermUsersRead, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		writeJSON(w, publicStudents(platform.ListStudents()))
	}))

	mux.HandleFunc("POST /v1/admin/users", authz.RequirePermission(platform, rbac.PermUsersCreate, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		var body engines.UserInput
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		created, err := platform.CreateUser(body)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		cp := *created
		cp.Password = ""
		writeJSON(w, cp)
	}))

	mux.HandleFunc("PUT /v1/admin/users/{id}", authz.RequirePermission(platform, rbac.PermUsersUpdate, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		var body engines.UserInput
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		targetID := r.PathValue("id")
		if targetID == actor.ID && len(body.Roles) == 0 && body.Role != "" && !rbac.IsAdministrator(body.Role) {
			http.Error(w, `{"error":"cannot_demote_self"}`, http.StatusForbidden)
			return
		}
		updated, err := platform.UpdateUser(targetID, body)
		if err != nil {
			status := http.StatusBadRequest
			if err.Error() == "not_found" {
				status = http.StatusNotFound
			}
			http.Error(w, `{"error":"`+err.Error()+`"}`, status)
			return
		}
		cp := *updated
		cp.Password = ""
		writeJSON(w, cp)
	}))

	mux.HandleFunc("DELETE /v1/admin/users/{id}", authz.RequirePermission(platform, rbac.PermUsersDelete, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		targetID := r.PathValue("id")
		if targetID == actor.ID {
			http.Error(w, `{"error":"cannot_delete_self"}`, http.StatusForbidden)
			return
		}
		if err := platform.DeleteUser(targetID); err != nil {
			status := http.StatusBadRequest
			if err.Error() == "not_found" {
				status = http.StatusNotFound
			}
			http.Error(w, `{"error":"`+err.Error()+`"}`, status)
			return
		}
		writeJSON(w, map[string]any{"ok": true})
	}))

	mux.HandleFunc("GET /v1/admin/content", authz.RequirePermission(platform, rbac.PermContentRead, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		writeJSON(w, contentStore.Snapshot())
	}))

	mux.HandleFunc("POST /v1/admin/content/quests", authz.RequirePermission(platform, rbac.PermContentWrite, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		var body admincontent.Quest
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		if err := contentStore.UpsertQuest(body); err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		writeJSON(w, map[string]any{"ok": true, "quest": body})
	}))

	mux.HandleFunc("DELETE /v1/admin/content/quests/{key}", authz.RequirePermission(platform, rbac.PermContentDelete, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		key := r.PathValue("key")
		if err := contentStore.DeleteQuest(key); err != nil {
			http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
			return
		}
		writeJSON(w, map[string]any{"ok": true})
	}))

	mux.HandleFunc("POST /v1/admin/content/achievements", authz.RequirePermission(platform, rbac.PermContentWrite, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		var body admincontent.Achievement
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		if err := contentStore.UpsertAchievement(body); err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		writeJSON(w, map[string]any{"ok": true, "achievement": body})
	}))

	mux.HandleFunc("DELETE /v1/admin/content/achievements/{key}", authz.RequirePermission(platform, rbac.PermContentDelete, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		key := r.PathValue("key")
		if err := contentStore.DeleteAchievement(key); err != nil {
			http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
			return
		}
		writeJSON(w, map[string]any{"ok": true})
	}))

	mux.HandleFunc("POST /v1/attendance/confirm", func(w http.ResponseWriter, r *http.Request) {
		actor, ok := authz.PrincipalFromRequest(platform, r)
		if !ok {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}
		var body struct {
			StudentID    string `json:"studentId"`
			AttendanceID string `json:"attendanceId"`
			XP           int64  `json:"xp"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		if !actor.HasPermission(rbac.PermAttendanceConfirm) && actor.ID != body.StudentID {
			http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
			return
		}
		if !actor.IsPlatformAdmin() && actor.ID != body.StudentID && body.StudentID == "" {
			http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
			return
		}
		mu.Lock()
		s, ok := platform.GetStudent(body.StudentID)
		if !ok || s.CharacterID == "" {
			mu.Unlock()
			http.Error(w, `{"error":"student_or_character_missing"}`, http.StatusBadRequest)
			return
		}
		if body.XP == 0 {
			body.XP = 500
		}
		lvl, granted, err := platform.RecordAttendance(s.CharacterID, body.AttendanceID, body.XP)
		mu.Unlock()
		if err != nil {
			http.Error(w, `{"error":"attendance_failed"}`, http.StatusBadRequest)
			return
		}
		writeJSON(w, map[string]any{"level": lvl, "granted": granted})
	})

	mux.HandleFunc("POST /v1/mastery/snapshot", authz.RequirePermission(platform, rbac.PermUsersUpdate, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		var body struct {
			StudentID   string  `json:"studentId"`
			WeaponAlias string  `json:"weaponAlias"`
			Points      float64 `json:"points"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		if err := platform.ApplyMasterySnapshot(body.StudentID, body.WeaponAlias, body.Points); err != nil {
			http.Error(w, `{"error":"mastery_failed"}`, http.StatusBadRequest)
			return
		}
		writeJSON(w, map[string]any{"ok": true})
	}))

	log.Printf("school-api listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, withCORS(mux)))
}

func publicStudents(list []*engines.Student) []engines.Student {
	out := make([]engines.Student, 0, len(list))
	for _, s := range list {
		cp := *s
		cp.Password = ""
		out = append(out, cp)
	}
	return out
}

func permissionListForRoles(roles []string) []string {
	perms := rbac.MergePermissions(roles)
	keys := make([]string, 0, len(perms))
	for p := range perms {
		keys = append(keys, string(p))
	}
	return keys
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
