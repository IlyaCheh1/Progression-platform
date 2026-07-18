package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/masterofsword/contracts/engines"
	"github.com/masterofsword/school-api/internal/seed"
)

// Shared in-process platform for local modular monolith slice.
// Production: school-api publishes events; platform-worker consumes.
var platform = engines.NewPlatform()

func main() {
	seed.MustLoad(platform)
	addr := env("SCHOOL_API_ADDR", ":8082")
	mux := http.NewServeMux()
	var mu sync.Mutex

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, map[string]any{"ok": true, "service": "school-api"})
	})

	mux.HandleFunc("GET /v1/students", func(w http.ResponseWriter, r *http.Request) {
		list := platform.ListStudents()
		out := make([]engines.Student, 0, len(list))
		for _, s := range list {
			cp := *s
			cp.Password = ""
			out = append(out, cp)
		}
		writeJSON(w, out)
	})

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
		public := *s
		public.Password = ""
		writeJSON(w, map[string]any{
			"accessToken": "demo." + s.ID,
			"student":     public,
		})
	})

	mux.HandleFunc("POST /v1/attendance/confirm", func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			StudentID    string `json:"studentId"`
			AttendanceID string `json:"attendanceId"`
			XP           int64  `json:"xp"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
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
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		writeJSON(w, map[string]any{"level": lvl, "granted": granted})
	})

	mux.HandleFunc("POST /v1/mastery/snapshot", func(w http.ResponseWriter, r *http.Request) {
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
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		writeJSON(w, map[string]any{"ok": true})
	})

	// Expose platform for seed tooling in same process via import pattern — seed uses shared package.
	_ = mu

	log.Printf("school-api listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, withCORS(mux)))
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
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
