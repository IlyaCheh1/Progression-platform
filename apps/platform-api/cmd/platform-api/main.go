package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/masterofsword/contracts/engines"
)

func main() {
	addr := env("PLATFORM_API_ADDR", ":8081")
	p := engines.NewPlatform()
	// seed synthetic character for health vertical slice
	_, _ = p.CreateCharacter("char-demo", "user-demo")

	mux := http.NewServeMux()
	var mu sync.Mutex

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, map[string]any{"ok": true, "service": "platform-api"})
	})

	mux.HandleFunc("GET /v1/characters/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		c, ok := p.GetCharacter(id)
		if !ok {
			http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
			return
		}
		writeJSON(w, c)
	})

	mux.HandleFunc("POST /v1/characters", func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			ID     string `json:"id"`
			UserID string `json:"userId"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		mu.Lock()
		c, err := p.CreateCharacter(body.ID, body.UserID)
		mu.Unlock()
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusConflict)
			return
		}
		writeJSON(w, c)
	})

	mux.HandleFunc("POST /v1/rewards/attendance", func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			CharacterID  string `json:"characterId"`
			AttendanceID string `json:"attendanceId"`
			XP           int64  `json:"xp"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		if body.XP == 0 {
			body.XP = 500
		}
		lvl, granted, err := p.RecordAttendance(body.CharacterID, body.AttendanceID, body.XP)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		c, _ := p.GetCharacter(body.CharacterID)
		writeJSON(w, map[string]any{"level": lvl, "granted": granted, "character": c})
	})

	mux.HandleFunc("GET /v1/audit", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, map[string]any{"entries": p.Audit(), "outbox": p.OutboxLen()})
	})

	log.Printf("platform-api listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
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
