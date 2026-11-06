package kds_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	internalkds "menuflow/backend/internal/kds"
	pkgws "menuflow/backend/pkg/websocket"
)

func TestGetActiveKDSOrders(t *testing.T) {
	repo := internalkds.NewMemoryRepository()
	hub := pkgws.NewHub()
	handler := internalkds.NewHandler(repo, hub)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/kds/orders/active", nil)
	rec := httptest.NewRecorder()

	handler.HandleGetActiveOrders(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for active KDS orders, got %d", rec.Code)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal KDS response: %v", err)
	}

	total, _ := resp["total"].(float64)
	if total < 1 {
		t.Errorf("expected at least 1 active KDS order, got %v", total)
	}
}
