package kds_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	internalkds "menuflow/backend/internal/kds"
	pkgws "menuflow/backend/pkg/websocket"
)

func TestUpdateKDSStatusTransition(t *testing.T) {
	repo := internalkds.NewMemoryRepository()
	hub := pkgws.NewHub()
	handler := internalkds.NewHandler(repo, hub)

	// 1. Test Valid One-Tap Transition: Received -> Preparing
	payload1 := internalkds.StatusUpdateRequest{
		FromStatus: "Received",
		ToStatus:   "Preparing",
	}
	body1, _ := json.Marshal(payload1)
	req1 := httptest.NewRequest(http.MethodPatch, "/api/v1/kds/orders/status?id=01J8ORDKDS01", bytes.NewReader(body1))
	rec1 := httptest.NewRecorder()

	handler.HandleUpdateStatus(rec1, req1)

	if rec1.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for status update, got %d. Body: %s", rec1.Code, rec1.Body.String())
	}

	var updated1 internalkds.KDSOrderCard
	json.Unmarshal(rec1.Body.Bytes(), &updated1)

	if updated1.Status != "Preparing" {
		t.Errorf("expected status Preparing, got %s", updated1.Status)
	}

	// 2. Test Invalid Transition Jump: Received -> Ready (must fail with 400 Bad Request)
	payload2 := internalkds.StatusUpdateRequest{
		FromStatus: "Received",
		ToStatus:   "Ready",
	}
	body2, _ := json.Marshal(payload2)
	req2 := httptest.NewRequest(http.MethodPatch, "/api/v1/kds/orders/status?id=01J8ORDKDS01", bytes.NewReader(body2))
	rec2 := httptest.NewRecorder()

	handler.HandleUpdateStatus(rec2, req2)

	if rec2.Code != http.StatusBadRequest {
		t.Errorf("expected status 400 Bad Request for invalid transition jump, got %d", rec2.Code)
	}
}
