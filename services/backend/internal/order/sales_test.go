package order_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	internalorder "menuflow/backend/internal/order"
)

func TestGetSalesSummary(t *testing.T) {
	repo := internalorder.NewMemoryRepository()
	handler := internalorder.NewHandler(repo)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/orders/sales-summary", nil)
	rec := httptest.NewRecorder()

	handler.HandleGetSalesSummary(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for sales summary, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var resp internalorder.SalesSummaryResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal sales summary response: %v", err)
	}

	if resp.TotalSalesETB <= 0 || resp.AverageOrderValue <= 0 {
		t.Errorf("expected positive sales metrics, got %+v", resp)
	}

	if len(resp.BestSellers) == 0 {
		t.Errorf("expected best seller items, got 0")
	}

	if len(resp.ProviderTotals) != 4 {
		t.Errorf("expected 4 provider totals (telebirr, chapa, cbe, cash), got %d", len(resp.ProviderTotals))
	}
}
