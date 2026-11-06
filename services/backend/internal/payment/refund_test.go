package payment_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	internalpayment "menuflow/backend/internal/payment"
	pkgpayment "menuflow/backend/pkg/payment"
)

func TestAutomatedPaymentRefund(t *testing.T) {
	repo := internalpayment.NewMemoryRepository()
	handler := internalpayment.NewHandler(repo)

	// Create initial paid payment
	p, err := repo.CreatePayment(context.Background(), internalpayment.PaymentEntity{
		OrderID:      "01J8ORDER100",
		RestaurantID: "01J8REST100",
		Provider:     "chapa",
		ProviderTxID: "CHP-TX-100200",
		Amount:       1012.00,
		Status:       "paid",
	})
	if err != nil {
		t.Fatalf("failed to create payment: %v", err)
	}

	// 1. Execute Refund
	refundReq := internalpayment.RefundRequest{
		PaymentID: p.ID,
		Amount:    1012.00,
		Reason:    "Guest cancelled pre-Received",
	}

	body, _ := json.Marshal(refundReq)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/payments/refund", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	handler.HandleRefundPayment(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for refund, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var resp pkgpayment.RefundResponse
	json.Unmarshal(rec.Body.Bytes(), &resp)

	if resp.Status != "refunded" || resp.RefundTxID == "" {
		t.Errorf("expected status refunded, got %+v", resp)
	}
}

func TestManualRefundQueueListing(t *testing.T) {
	repo := internalpayment.NewMemoryRepository()
	handler := internalpayment.NewHandler(repo)

	req := httptest.NewRequest(http.MethodGet, "/ops/platform/refunds/manual", nil)
	rec := httptest.NewRecorder()

	handler.HandleGetManualRefundQueue(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for manual refund queue, got %d", rec.Code)
	}

	var resp map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &resp)

	total, _ := resp["total"].(float64)
	if total < 1 {
		t.Errorf("expected at least 1 queued manual refund, got %v", total)
	}
}
