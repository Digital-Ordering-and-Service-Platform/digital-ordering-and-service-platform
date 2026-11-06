package payment_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	internalpayment "menuflow/backend/internal/payment"
)

func TestCashierSettleOrder(t *testing.T) {
	repo := internalpayment.NewMemoryRepository()
	handler := internalpayment.NewHandler(repo)

	// Settle unpaid cash order
	payload := map[string]string{
		"order_id": "01J8ORDER100",
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/cashier/settle", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	handler.HandleCashierSettle(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for cashier settlement, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &resp)

	if resp["payment_status"] != "paid" {
		t.Errorf("expected payment_status paid, got %v", resp["payment_status"])
	}
}
