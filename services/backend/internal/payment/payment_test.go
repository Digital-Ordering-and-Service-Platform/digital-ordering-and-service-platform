package payment_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	internalpayment "menuflow/backend/internal/payment"
	pkgpayment "menuflow/backend/pkg/payment"
)

func TestPaymentInitiationDigitalRails(t *testing.T) {
	repo := internalpayment.NewMemoryRepository()
	handler := internalpayment.NewHandler(repo)

	rails := []string{"telebirr", "chapa", "cbe"}
	for _, rail := range rails {
		t.Run("Initiate_"+rail, func(t *testing.T) {
			payload := internalpayment.InitiateRequest{
				OrderID:  "01J8ORDER100",
				Provider: rail,
				Amount:   1012.00,
			}

			body, _ := json.Marshal(payload)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/payments/initiate", bytes.NewReader(body))
			rec := httptest.NewRecorder()

			handler.HandleInitiatePayment(rec, req)

			if rec.Code != http.StatusOK {
				t.Fatalf("expected status 200 OK for %s initiation, got %d. Body: %s", rail, rec.Code, rec.Body.String())
			}

			var resp pkgpayment.InitiatePaymentResponse
			if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
				t.Fatalf("failed to unmarshal payment response: %v", err)
			}

			if resp.CheckoutURL == "" || resp.ProviderTxID == "" {
				t.Errorf("expected checkout_url and provider_tx_id for %s, got %+v", rail, resp)
			}
		})
	}
}

func TestPaymentInitiationCashFallback(t *testing.T) {
	repo := internalpayment.NewMemoryRepository()
	handler := internalpayment.NewHandler(repo)

	payload := internalpayment.InitiateRequest{
		OrderID:  "01J8ORDER101",
		Provider: "cash",
		Amount:   650.00,
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/payments/initiate", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	handler.HandleInitiatePayment(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for cash initiation, got %d", rec.Code)
	}

	var resp map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &resp)

	if resp["provider"] != "cash" || resp["status"] != "pending" {
		t.Errorf("unexpected cash response: %v", resp)
	}
}
