package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	pkgmw "menuflow/backend/pkg/middleware"
)

func TestIdempotencyMiddleware(t *testing.T) {
	handler := pkgmw.IdempotencyMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("PROCESSED"))
	}))

	key := "01J8INTENT100200"

	// 1. First Request - Success
	req1 := httptest.NewRequest(http.MethodPost, "/api/v1/orders/create", nil)
	req1.Header.Set("X-Idempotency-Key", key)
	rec1 := httptest.NewRecorder()

	handler.ServeHTTP(rec1, req1)

	if rec1.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for first submit, got %d", rec1.Code)
	}

	// 2. Immediate Duplicate Request - Rejection 409 Conflict (AD-7)
	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/orders/create", nil)
	req2.Header.Set("X-Idempotency-Key", key)
	rec2 := httptest.NewRecorder()

	handler.ServeHTTP(rec2, req2)

	if rec2.Code != http.StatusConflict {
		t.Errorf("expected status 409 Conflict for duplicate intent, got %d", rec2.Code)
	}
}
