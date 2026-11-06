package tenant_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	internaltenant "menuflow/backend/internal/tenant"
	pkgtenant "menuflow/backend/pkg/tenant"
)

func TestHandleResolveQRToken(t *testing.T) {
	repo := internaltenant.NewMemoryRepository()
	handler := internaltenant.NewHandler(repo, tenantTestSecret)

	// Generate valid QR token
	tokenPayload := pkgtenant.QRTokenPayload{
		RestaurantID: "01J8REST100",
		Type:         "pickup",
		TargetID:     "01J8PICKUP100",
		Label:        "P04",
		Version:      1,
	}
	tokenStr, _ := pkgtenant.GenerateQRToken(tenantTestSecret, tokenPayload)

	// 1. Resolve Valid Token
	req := httptest.NewRequest(http.MethodGet, "/api/v1/guest/qr/resolve?token="+tokenStr, nil)
	rec := httptest.NewRecorder()

	handler.HandleResolveQRToken(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for valid QR token resolve, got %d", rec.Code)
	}

	var resp map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &resp)

	if resp["label"] != "P04" || resp["type"] != "pickup" {
		t.Errorf("unexpected resolved payload: %v", resp)
	}

	// 2. Reject Invalid/Revoked Token
	reqInvalid := httptest.NewRequest(http.MethodGet, "/api/v1/guest/qr/resolve?token=invalid.token.str", nil)
	recInvalid := httptest.NewRecorder()

	handler.HandleResolveQRToken(recInvalid, reqInvalid)

	if recInvalid.Code != http.StatusBadRequest {
		t.Errorf("expected status 400 Bad Request for invalid token, got %d", recInvalid.Code)
	}
}
