package middleware

import (
	"fmt"
	"net/http"

	pkgauth "menuflow/backend/pkg/auth"
)

// ValidateStaffWSUpgrade verifies HTTP-only staff session cookie on WebSocket handshake (/api/v1/ws/staff) per AD-9.
func ValidateStaffWSUpgrade(r *http.Request, secretKey string) (*pkgauth.StaffClaims, error) {
	cookie, err := r.Cookie("menuflow_staff_session")
	if err != nil || cookie.Value == "" {
		return nil, fmt.Errorf("ws_auth: missing HTTP-only staff session cookie")
	}

	claims, err := pkgauth.ParseJWT(secretKey, cookie.Value)
	if err != nil {
		return nil, fmt.Errorf("ws_auth: invalid or expired JWT cookie: %w", err)
	}

	return claims, nil
}
