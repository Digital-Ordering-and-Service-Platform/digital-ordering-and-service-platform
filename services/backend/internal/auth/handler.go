package auth

import (
	"encoding/json"
	"net/http"
	"time"

	pkgauth "menuflow/backend/pkg/auth"
)

const CookieName = "menuflow_staff_session"

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Message string               `json:"message"`
	User    *pkgauth.StaffClaims `json:"user,omitempty"`
}

type Handler struct {
	SecretKey string
	// DB hook placeholder for user lookup
}

func NewHandler(secretKey string) *Handler {
	return &Handler{
		SecretKey: secretKey,
	}
}

// HandleLogin processes POST /api/v1/auth/login and sets the HTTP-only cookie per AD-9.
func (h *Handler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Demo mock validation for authentication scaffolding
	if req.Email == "" || req.Password == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid email or password"})
		return
	}

	claims := pkgauth.StaffClaims{
		Sub:  "01J8STAFFUSER0000000000001",
		Rid:  "01J8RESTAURANT000000000001",
		Role: "admin",
	}

	tokenStr, err := pkgauth.GenerateJWT(h.SecretKey, claims, 24*time.Hour)
	if err != nil {
		http.Error(w, "Failed to issue session token", http.StatusInternalServerError)
		return
	}

	// Issue HTTP-only, Secure, SameSite=Lax cookie per AD-9
	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    tokenStr,
		Path:     "/",
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   r.TLS != nil,
		SameSite: http.SameSiteLaxMode,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(AuthResponse{
		Message: "Login successful",
		User:    &claims,
	})
}

// HandleLogout processes POST /api/v1/auth/logout and clears the HTTP-only cookie.
func (h *Handler) HandleLogout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   r.TLS != nil,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(AuthResponse{
		Message: "Logged out successfully",
	})
}
