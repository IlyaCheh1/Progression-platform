package admincontent

import (
	"encoding/json"
	"net/http"
)

type WriteJSONFunc func(w http.ResponseWriter, v any)
type GuardFunc func(next http.HandlerFunc) http.HandlerFunc

type RouteDeps struct {
	Store         *Store
	WriteJSON     WriteJSONFunc
	GuardRead     GuardFunc
	GuardWrite    GuardFunc
	GuardDelete   GuardFunc
}

func RegisterRoutes(mux *http.ServeMux, deps RouteDeps) {
	st := deps.Store
	write := deps.WriteJSON

	mux.HandleFunc("GET /v1/admin/content", deps.GuardRead(func(w http.ResponseWriter, r *http.Request) {
		write(w, st.Snapshot())
	}))

	registerEntity(mux, deps, "quests",
		func(w http.ResponseWriter, r *http.Request) {
			var body Quest
			if !decodeBody(w, r, &body) {
				return
			}
			if key := r.PathValue("key"); key != "" {
				body.Key = key
			}
			if err := st.UpsertQuest(body); err != nil {
				http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
				return
			}
			write(w, map[string]any{"ok": true, "quest": body})
		},
		func(w http.ResponseWriter, r *http.Request) {
			if err := st.DeleteQuest(r.PathValue("key")); err != nil {
				http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
				return
			}
			write(w, map[string]any{"ok": true})
		},
	)

	registerEntity(mux, deps, "achievements",
		func(w http.ResponseWriter, r *http.Request) {
			var body Achievement
			if !decodeBody(w, r, &body) {
				return
			}
			if key := r.PathValue("key"); key != "" {
				body.Key = key
			}
			if err := st.UpsertAchievement(body); err != nil {
				http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
				return
			}
			write(w, map[string]any{"ok": true, "achievement": body})
		},
		func(w http.ResponseWriter, r *http.Request) {
			if err := st.DeleteAchievement(r.PathValue("key")); err != nil {
				http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
				return
			}
			write(w, map[string]any{"ok": true})
		},
	)

	registerEntity(mux, deps, "talents",
		func(w http.ResponseWriter, r *http.Request) {
			var body Talent
			if !decodeBody(w, r, &body) {
				return
			}
			if key := r.PathValue("key"); key != "" {
				body.Key = key
			}
			if err := st.UpsertTalent(body); err != nil {
				http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
				return
			}
			write(w, map[string]any{"ok": true, "talent": body})
		},
		func(w http.ResponseWriter, r *http.Request) {
			if err := st.DeleteTalent(r.PathValue("key")); err != nil {
				http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
				return
			}
			write(w, map[string]any{"ok": true})
		},
	)

	registerEntity(mux, deps, "items",
		func(w http.ResponseWriter, r *http.Request) {
			var body Item
			if !decodeBody(w, r, &body) {
				return
			}
			if key := r.PathValue("key"); key != "" {
				body.Key = key
			}
			if err := st.UpsertItem(body); err != nil {
				http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
				return
			}
			write(w, map[string]any{"ok": true, "item": body})
		},
		func(w http.ResponseWriter, r *http.Request) {
			if err := st.DeleteItem(r.PathValue("key")); err != nil {
				http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
				return
			}
			write(w, map[string]any{"ok": true})
		},
	)

	registerEntity(mux, deps, "rewards",
		func(w http.ResponseWriter, r *http.Request) {
			var body Reward
			if !decodeBody(w, r, &body) {
				return
			}
			if key := r.PathValue("key"); key != "" {
				body.Key = key
			}
			if err := st.UpsertReward(body); err != nil {
				http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
				return
			}
			write(w, map[string]any{"ok": true, "reward": body})
		},
		func(w http.ResponseWriter, r *http.Request) {
			if err := st.DeleteReward(r.PathValue("key")); err != nil {
				http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
				return
			}
			write(w, map[string]any{"ok": true})
		},
	)

	registerEntity(mux, deps, "schools",
		func(w http.ResponseWriter, r *http.Request) {
			var body School
			if !decodeBody(w, r, &body) {
				return
			}
			if key := r.PathValue("key"); key != "" {
				body.Key = key
			}
			if err := st.UpsertSchool(body); err != nil {
				http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
				return
			}
			write(w, map[string]any{"ok": true, "school": body})
		},
		func(w http.ResponseWriter, r *http.Request) {
			if err := st.DeleteSchool(r.PathValue("key")); err != nil {
				http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
				return
			}
			write(w, map[string]any{"ok": true})
		},
	)
}

func registerEntity(
	mux *http.ServeMux,
	deps RouteDeps,
	name string,
	upsert http.HandlerFunc,
	del http.HandlerFunc,
) {
	mux.HandleFunc("POST /v1/admin/content/"+name, deps.GuardWrite(upsert))
	mux.HandleFunc("PUT /v1/admin/content/"+name+"/{key}", deps.GuardWrite(upsert))
	mux.HandleFunc("DELETE /v1/admin/content/"+name+"/{key}", deps.GuardDelete(del))
}

func decodeBody(w http.ResponseWriter, r *http.Request, dst any) bool {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
		return false
	}
	return true
}
