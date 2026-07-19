package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"sync"
	"syscall"
	"time"

	"github.com/masterofsword/contracts/engines"
	"github.com/masterofsword/contracts/persist"
	"github.com/masterofsword/contracts/rbac"
	"github.com/masterofsword/school-api/internal/admincontent"
	"github.com/masterofsword/school-api/internal/authz"
	"github.com/masterofsword/school-api/internal/avatarupload"
	"github.com/masterofsword/school-api/internal/seed"
	"github.com/masterofsword/school-api/internal/schoolroutes"
	"github.com/masterofsword/school-api/internal/storage"
)

// Shared in-process platform for local modular monolith slice.
// Production: school-api publishes events; platform-worker consumes.
var platform = engines.NewPlatform()
var contentStore *admincontent.Store

func main() {
	root := seed.FindRoot()
	contentStore = admincontent.MustLoad(root)

	statePath := env("SCHOOL_STATE_PATH", "")
	dbURL := env("DATABASE_URL", "")
	if dbURL != "" {
		if err := persist.LoadPlatformFromPostgres(platform, dbURL); err != nil {
			log.Printf("postgres load: %v (will bootstrap roster if empty)", err)
		} else {
			log.Printf("restored platform state from postgres row-level repos")
		}
	} else if statePath != "" {
		if err := persist.LoadPlatform(platform, statePath); err != nil {
			log.Printf("state load: %v (will bootstrap roster if empty)", err)
		} else {
			log.Printf("restored platform state from %s", statePath)
		}
	}

	// Production: seed only when DB/state has no students. Local without persistence still seeds.
	seed.MustLoadIfEmpty(platform)

	saveState := func() {
		if dbURL != "" {
			if err := persist.SavePlatformToPostgres(platform, dbURL); err != nil {
				log.Printf("postgres save: %v", err)
			}
			return
		}
		if statePath != "" {
			if err := persist.SavePlatform(platform, statePath); err != nil {
				log.Printf("state save: %v", err)
			}
		}
	}

	// Excel mastery points → character XP/level (1 display point = 1 XP).
	// Runs after seed + optional postgres restore so levels survive restarts.
	if n := platform.SyncCharacterXPFromMastery(); n > 0 {
		log.Printf("synced character XP/level from weapon mastery for %d students", n)
		saveState()
	}

	if dbURL != "" || statePath != "" {
		go func() {
			ticker := time.NewTicker(30 * time.Second)
			for range ticker.C {
				saveState()
				if dbURL != "" {
					if n, err := persist.DrainPostgresOutbox(dbURL, 50); err != nil {
						log.Printf("outbox drain: %v", err)
					} else if n > 0 {
						platform.ProcessUnpublishedOutbox()
						log.Printf("drained %d outbox events", n)
					}
				} else {
					n := platform.ProcessUnpublishedOutbox()
					if n > 0 {
						log.Printf("marked %d outbox entries published", n)
					}
				}
			}
		}()
	}

	// Default loopback-only: temporary local auth must not be exposed on LAN.
	addr := env("SCHOOL_API_ADDR", "127.0.0.1:8082")
	mux := http.NewServeMux()
	var mu sync.Mutex

	var s3Client *storage.Client
	if s3Cfg, ok := storage.ConfigFromEnv(); ok {
		client, err := storage.NewClient(context.Background(), s3Cfg)
		if err != nil {
			log.Printf("s3 client: %v (avatar upload disabled)", err)
		} else {
			s3Client = client
			log.Printf("s3 avatar storage ready (bucket=%s)", s3Cfg.Bucket)
		}
	} else {
		log.Printf("s3 env incomplete — avatar upload disabled")
	}
	avatarPending := avatarupload.NewRegistry()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, map[string]any{"ok": true, "service": "school-api"})
	})

	mux.HandleFunc("GET /ready", func(w http.ResponseWriter, r *http.Request) {
		status := map[string]any{"ok": true, "checks": map[string]any{"platform": true}}
		if dbURL != "" {
			err := persist.PingPostgres(dbURL)
			status["checks"] = map[string]any{"platform": true, "postgres": err == nil}
		if err != nil {
			status["ok"] = false
			w.WriteHeader(http.StatusServiceUnavailable)
			writeJSON(w, status)
			return
		}
		}
		writeJSON(w, status)
	})

	mux.HandleFunc("GET /v1/students", authz.RequirePermission(platform, rbac.PermSchoolRead, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		writeJSON(w, publicStudents(platform.ListStudents()))
	}))

	mux.HandleFunc("GET /v1/students/{id}", authz.RequirePermission(platform, rbac.PermSchoolRead, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		s, ok := platform.GetStudent(r.PathValue("id"))
		if !ok {
			http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
			return
		}
		writeJSON(w, publicStudent(s))
	}))

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
		limited := http.MaxBytesReader(w, r.Body, 512<<10) // avatar data URL + profile fields
		if err := json.NewDecoder(limited).Decode(&body); err != nil {
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

	mux.HandleFunc("POST /v1/profile/avatar/presign", authz.RequireAuth(platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		if s3Client == nil {
			http.Error(w, `{"error":"storage_unavailable"}`, http.StatusServiceUnavailable)
			return
		}
		var body struct {
			Filename string `json:"filename"`
			MimeType string `json:"mimeType"`
			FileSize string `json:"fileSize"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		mime, ext, ok := avatarupload.NormalizeMIME(body.MimeType)
		if !ok {
			http.Error(w, `{"error":"invalid_avatar"}`, http.StatusBadRequest)
			return
		}
		if fileExt := avatarupload.ExtFromFilename(body.Filename); fileExt != "" {
			ext = fileExt
		}
		size, err := strconv.ParseInt(body.FileSize, 10, 64)
		if err != nil || size <= 0 {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		if size > avatarupload.MaxFileSizeBytes {
			http.Error(w, `{"error":"avatar_too_large"}`, http.StatusBadRequest)
			return
		}
		key := avatarupload.ObjectKey(actor.ID, ext)
		uploadURL, err := s3Client.PresignPut(r.Context(), key, mime)
		if err != nil {
			log.Printf("avatar presign: %v", err)
			http.Error(w, `{"error":"avatar_presign_failed"}`, http.StatusBadGateway)
			return
		}
		fileID := avatarPending.Put(actor.ID, key, mime)
		writeJSON(w, map[string]any{
			"uploadUrl": uploadURL,
			"fileId":    fileID,
			"key":       key,
		})
	}))

	mux.HandleFunc("POST /v1/profile/avatar/confirm", authz.RequireAuth(platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		if s3Client == nil {
			http.Error(w, `{"error":"storage_unavailable"}`, http.StatusServiceUnavailable)
			return
		}
		var body struct {
			FileID string `json:"fileId"`
			Key    string `json:"key"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.FileID == "" {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		pending, ok := avatarPending.Take(body.FileID, actor.ID)
		if !ok {
			http.Error(w, `{"error":"avatar_upload_expired"}`, http.StatusBadRequest)
			return
		}
		if body.Key != "" && body.Key != pending.Key {
			http.Error(w, `{"error":"avatar_key_mismatch"}`, http.StatusBadRequest)
			return
		}
		if err := s3Client.HeadObject(r.Context(), pending.Key); err != nil {
			log.Printf("avatar head: %v", err)
			http.Error(w, `{"error":"avatar_upload_failed"}`, http.StatusBadRequest)
			return
		}
		publicURL := s3Client.PublicURL(pending.Key)
		view, err := platform.UpdateStudentProfile(actor.ID, engines.ProfileInput{AvatarURL: &publicURL})
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
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

	mux.HandleFunc("POST /v1/store/purchase", authz.RequireAuth(platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		var body engines.PurchaseInventoryInput
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		view, err := platform.PurchaseInventoryItem(actor.ID, body)
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

	guardContent := func(perm rbac.Permission) admincontent.GuardFunc {
		return func(next http.HandlerFunc) http.HandlerFunc {
			return authz.RequirePermission(platform, perm, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
				next(w, r)
			})
		}
	}
	admincontent.RegisterRoutes(mux, admincontent.RouteDeps{
		Store:       contentStore,
		WriteJSON:   writeJSON,
		GuardRead:   guardContent(rbac.PermContentRead),
		GuardWrite:  guardContent(rbac.PermContentWrite),
		GuardDelete: guardContent(rbac.PermContentDelete),
	})

	schoolroutes.Register(mux, schoolroutes.Deps{Platform: platform, Content: contentStore, WriteJSON: writeJSON})

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
	go func() {
		sig := make(chan os.Signal, 1)
		signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
		<-sig
		log.Println("shutting down, saving state…")
		saveState()
		os.Exit(0)
	}()
	log.Fatal(http.ListenAndServe(addr, withCORS(mux)))
}

// publicStudent strips credentials and private media (avatar data URLs) from shared student payloads.
func publicStudent(s *engines.Student) engines.Student {
	cp := *s
	cp.Password = ""
	cp.AvatarURL = ""
	return cp
}

func publicStudents(list []*engines.Student) []engines.Student {
	out := make([]engines.Student, 0, len(list))
	for _, s := range list {
		out = append(out, publicStudent(s))
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
