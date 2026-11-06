package payment_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	internalpayment "menuflow/backend/internal/payment"
)

func TestHandleWebhookIdempotency(t *testing.T) {
	repo := internalpayment.NewMemoryRepository()
	handler := internalpayment.NewHandler(repo)

	webhookPayload := map[string]string{
		"event":          "payment.success",
		"provider_tx_id": "CHP-TX-100200300",
		"order_id":       "01J8ORDER100",
		"amount":         "1012.00",
	}

	body, _ := json.Marshal(webhookPayload)

	// 1. First Webhook Delivery
	req1 := httptest.NewRequest(http.MethodPost, "/api/v1/payments/webhook/chapa", bytes.NewReader(body))
	rec1 := httptest.NewRecorder()

	handler.HandleWebhook(rec1, req1)

	if rec1.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for first webhook, got %d", rec1.Code)
	}

	var resp1 map[string]interface{}
	json.Unmarshal(rec1.Body.Bytes(), &resp1)

	if resp1["status"] != "processed" {
		t.Errorf("unexpected status for first webhook: %v", resp1)
	}

	// 2. Duplicate / Replayed Webhook Delivery (Must return 200 OK idempotently per AD-5 & FR-9)
	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/payments/webhook/chapa", bytes.NewReader(body))
	rec2 := httptest.NewRecorder()

	handler.HandleWebhook(rec2, req2)

	if rec2.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for duplicate webhook, got %d", rec2.Code)
	}
}
