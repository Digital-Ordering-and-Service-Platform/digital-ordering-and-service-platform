package tenant_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	internaltenant "menuflow/backend/internal/tenant"
)

const tenantTestSecret = "super-secret-tenant-key-32-bytes!"

func TestTenantOnboardingAndListing(t *testing.T) {
	repo := internaltenant.NewMemoryRepository()
	handler := internaltenant.NewHandler(repo, tenantTestSecret)

	// 1. Test Onboarding Success
	payload := internaltenant.OnboardRestaurantRequest{
		Name:                "Habesha Gourmet Cafe",
		EstablishmentMode:   "table_service",
		ServiceChargePct:    10.0,
		VATPct:              15.0,
		CashFallbackEnabled: true,
		AdminEmail:          "solomon@habesha.et",
		AdminPassword:       "securepassword123",
		AdminName:           "Solomon Owner",
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/ops/platform/restaurants", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	handler.HandleOnboardTenant(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status 201 Created, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	restMap, ok := resp["restaurant"].(map[string]interface{})
	if !ok || restMap["name"] != "Habesha Gourmet Cafe" {
		t.Errorf("unexpected restaurant name: %v", restMap)
	}

	// 2. Test Duplicate Admin Email Conflict
	reqDup := httptest.NewRequest(http.MethodPost, "/ops/platform/restaurants", bytes.NewReader(body))
	recDup := httptest.NewRecorder()

	handler.HandleOnboardTenant(recDup, reqDup)

	if recDup.Code != http.StatusConflict {
		t.Errorf("expected status 409 Conflict for duplicate email, got %d", recDup.Code)
	}

	// 3. Test List Tenants
	reqList := httptest.NewRequest(http.MethodGet, "/ops/platform/restaurants", nil)
	recList := httptest.NewRecorder()

	handler.HandleListTenants(recList, reqList)

	if recList.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for list, got %d", recList.Code)
	}

	var listResp map[string]interface{}
	json.Unmarshal(recList.Body.Bytes(), &listResp)

	total, _ := listResp["total"].(float64)
	if total != 1 {
		t.Errorf("expected total 1 tenant, got %v", total)
	}
}

func TestUpdateSubscription(t *testing.T) {
	repo := internaltenant.NewMemoryRepository()
	handler := internaltenant.NewHandler(repo, tenantTestSecret)

	// Create tenant first
	rest, _, err := repo.CreateTenant(nil, internaltenant.OnboardRestaurantRequest{
		Name:       "Bole Bistro",
		AdminEmail: "admin@bole.et",
	})
	if err != nil {
		t.Fatalf("failed to create tenant: %v", err)
	}

	// Update subscription
	patchBody := `{"plan":"pro","status":"active"}`
	req := httptest.NewRequest(http.MethodPatch, "/ops/platform/restaurants/billing?id="+rest.ID, bytes.NewReader([]byte(patchBody)))
	rec := httptest.NewRecorder()

	handler.HandleUpdateBilling(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for subscription update, got %d", rec.Code)
	}
}
