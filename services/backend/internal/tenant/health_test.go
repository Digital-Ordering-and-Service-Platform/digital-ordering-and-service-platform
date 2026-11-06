package tenant_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	internaltenant "menuflow/backend/internal/tenant"
)

func TestHandlePlatformHealth(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/ops/platform/health", nil)
	rec := httptest.NewRecorder()

	internaltenant.HandlePlatformHealth(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d", rec.Code)
	}

	var resp internaltenant.SystemHealthResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal health response: %v", err)
	}

	if resp.Status != "ok" {
		t.Errorf("expected status ok, got %s", resp.Status)
	}

	if len(resp.ProviderRails) != 3 {
		t.Errorf("expected 3 provider rails, got %d", len(resp.ProviderRails))
	}
}
