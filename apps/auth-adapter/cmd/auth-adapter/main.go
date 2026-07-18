package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"
)

// Minimal OnlyID-compatible local adapter (sandbox). Issues demo cookies via JSON tokens.
func main() {
	addr := env("AUTH_ADDR", ":8083")
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{"ok": true, "service": "auth-adapter"})
	})

	mux.HandleFunc("GET /oauth/authorize", func(w http.ResponseWriter, r *http.Request) {
		redirect := r.URL.Query().Get("redirect_uri")
		if redirect == "" {
			redirect = "http://localhost:3000/auth/callback"
		}
		http.Redirect(w, r, redirect+"?code=demo-auth-code", http.StatusFound)
	})

	mux.HandleFunc("POST /oauth/token", func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"access_token":  "demo-access-" + time.Now().Format("150405"),
			"refresh_token": "demo-refresh",
			"token_type":    "Bearer",
			"expires_in":    3600,
		})
	})

	log.Printf("auth-adapter listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
