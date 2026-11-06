package tenant_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	internaltenant "menuflow/backend/internal/tenant"
)

func TestGetAndUpdateSettings(t *testing.T) {
	repo := internaltenant.NewMemoryRepository()
	handler := internaltenant.NewHandler(repo, tenantTestSecret)

	// 1. GET Settings
	reqGet := httptest.NewRequest(http.MethodGet, "/api/v1/admin/settings", nil)
	recGet := httptest.NewRecorder()

	handler.HandleGetSettings(recGet, reqGet)

	if recGet.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for settings, got %d", recGet.Code)
	}

	var initialSettings internaltenant.Restaurant
	json.Unmarshal(recGet.Body.Bytes(), &initialSettings)

	// 2. PUT Settings Update (FR-18)
	updatePayload := internaltenant.Restaurant{
		EstablishmentMode:   "self_service",
		ServiceChargePct:    12.5,
		VATPct:              15.0,
		CashFallbackEnabled: true,
		PickupAlarmEnabled:  true,
	}

	body, _ := json.Marshal(updatePayload)
	reqPut := httptest.NewRequest(http.MethodPut, "/api/v1/admin/settings", bytes.NewReader(body))
	recPut := httptest.NewRecorder()

	handler.HandleUpdateSettings(recPut, reqPut)

	if recPut.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for settings update, got %d", recPut.Code)
	}

	var resp map[string]interface{}
	json.Unmarshal(recPut.Body.Bytes(), &resp)

	settingsMap, ok := resp["settings"].(map[string]interface{})
	if !ok || settingsMap["establishment_mode"] != "self_service" {
		t.Errorf("expected establishment_mode self_service, got %v", settingsMap)
	}
}
