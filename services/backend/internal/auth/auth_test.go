package auth_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	internalauth "menuflow/backend/internal/auth"
	pkgauth "menuflow/backend/pkg/auth"
	pkgmw "menuflow/backend/pkg/middleware"
)

const testSecret = "super-secret-test-key-32-bytes!!"

func TestJWT_GenerateAndParse(t *testing.T) {
	claims := pkgauth.StaffClaims{
		Sub:  "01J8STAFFUSER0000000000001",
		Rid:  "01J8RESTAURANT000000000001",
		Role: "admin",
	}

	token, err := pkgauth.GenerateJWT(testSecret, claims, 1*time.Hour)
	if err != nil {
		t.Fatalf("failed to generate JWT: %v", err)
	}

	parsed, err := pkgauth.ParseJWT(testSecret, token)
	if err != nil {
		t.Fatalf("failed to parse valid JWT: %v", err)
	}

	if parsed.Sub != claims.Sub || parsed.Rid != claims.Rid || parsed.Role != claims.Role {
		t.Errorf("parsed claims mismatch: got %+v, want %+v", parsed, claims)
	}
}

func TestLoginAndRBACMiddleware(t *testing.T) {
	handler := internalauth.NewHandler(testSecret)

	// 1. Test Login
	loginBody := `{"email":"admin@habesha.et","password":"secretpassword"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", strings.NewReader(loginBody))
	rec := httptest.NewRecorder()

	handler.HandleLogin(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	cookies := rec.Result().Cookies()
	var sessionCookie *http.Cookie
	for _, c := range cookies {
		if c.Name == internalauth.CookieName {
			sessionCookie = c
			break
		}
	}

	if sessionCookie == nil || !sessionCookie.HttpOnly {
		t.Fatalf("expected HTTP-only cookie %s to be set", internalauth.CookieName)
	}

	// 2. Test RBAC Allowed Call
	protectedHandler := pkgmw.RBACMiddleware(testSecret, "admin")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}))

	protectedReq := httptest.NewRequest(http.MethodGet, "/api/v1/admin/menu", nil)
	protectedReq.AddCookie(sessionCookie)
	protectedRec := httptest.NewRecorder()

	protectedHandler.ServeHTTP(protectedRec, protectedReq)

	if protectedRec.Code != http.StatusOK {
		t.Errorf("expected RBAC allowed status 200, got %d", protectedRec.Code)
	}

	// 3. Test RBAC Denied Call
	kitchenHandler := pkgmw.RBACMiddleware(testSecret, "kitchen")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	deniedRec := httptest.NewRecorder()
	kitchenHandler.ServeHTTP(deniedRec, protectedReq)

	if deniedRec.Code != http.StatusForbidden {
		t.Errorf("expected RBAC denied status 403, got %d", deniedRec.Code)
	}
}

func TestWSAuthValidation(t *testing.T) {
	claims := pkgauth.StaffClaims{
		Sub:  "01J8STAFFUSER0000000000001",
		Rid:  "01J8RESTAURANT000000000001",
		Role: "kitchen",
	}

	token, _ := pkgauth.GenerateJWT(testSecret, claims, 1*time.Hour)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/ws/staff", nil)
	req.AddCookie(&http.Cookie{
		Name:  internalauth.CookieName,
		Value: token,
	})

	validated, err := pkgmw.ValidateStaffWSUpgrade(req, testSecret)
	if err != nil {
		t.Fatalf("WS auth validation failed: %v", err)
	}

	if validated.Role != "kitchen" {
		t.Errorf("expected role kitchen, got %s", validated.Role)
	}
}
