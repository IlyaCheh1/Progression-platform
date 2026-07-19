package authz

import (
	"net/http"

	"github.com/masterofsword/contracts/engines"
	"github.com/masterofsword/contracts/rbac"
)

type Handler func(w http.ResponseWriter, r *http.Request, actor *engines.Student)

func RequirePermission(platform *engines.Platform, perm rbac.Permission, next Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		actor, ok := PrincipalFromRequest(platform, r)
		if !ok {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}
		if !actor.HasPermission(perm) {
			http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
			return
		}
		next(w, r, actor)
	}
}

func PrincipalFromRequest(platform *engines.Platform, r *http.Request) (*engines.Student, bool) {
	h := r.Header.Get("Authorization")
	if h == "" {
		return nil, false
	}
	const prefix = "Bearer "
	if len(h) < len(prefix) || h[:len(prefix)] != prefix {
		return nil, false
	}
	return platform.ResolveAccessToken(h[len(prefix):])
}

func RequireAuth(platform *engines.Platform, next Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		actor, ok := PrincipalFromRequest(platform, r)
		if !ok {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}
		next(w, r, actor)
	}
}
