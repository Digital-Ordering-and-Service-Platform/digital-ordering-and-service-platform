package middleware

import (
	"context"
	"net/http"
	"strings"

	pkgauth "menuflow/backend/pkg/auth"
)

type contextKey string

const (
	StaffClaimsKey contextKey = "staff_claims"
	TenantIDKey    contextKey = "tenant_id"
)

// RBACMiddleware parses the menuflow_staff_session cookie and checks if staff role is permitted.
func RBACMiddleware(secretKey string, allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie("menuflow_staff_session")
			if err != nil || cookie.Value == "" {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				w.Write([]byte(`{"error":"Unauthorized: missing session cookie"}`))
				return
			}

			claims, err := pkgauth.ParseJWT(secretKey, cookie.Value)
			if err != nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				w.Write([]byte(`{"error":"Unauthorized: invalid or expired session"}`))
				return
			}

			// Enforce Role-Based Access Control (FR-17)
			if len(allowedRoles) > 0 {
				roleAllowed := false
				for _, role := range allowedRoles {
					if strings.EqualFold(claims.Role, role) {
						roleAllowed = true
						break
					}
				}

				if !roleAllowed {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusForbidden)
					w.Write([]byte(`{"error":"Forbidden: insufficient role permissions"}`))
					return
				}
			}

			// Inject claims and tenant_id into request context per AD-2
			ctx := context.WithValue(r.Context(), StaffClaimsKey, claims)
			ctx = context.WithValue(ctx, TenantIDKey, claims.Rid)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
