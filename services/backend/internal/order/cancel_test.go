package order_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	internalorder "menuflow/backend/internal/order"
)

func TestGuestPreReceivedCancellation(t *testing.T) {
	repo := internalorder.NewMemoryRepository()
	handler := internalorder.NewHandler(repo)

	// Create initial order in Payment Confirmed status
	created, _ := repo.CreateOrder(context.Background(), internalorder.OrderEntity{
		RestaurantID:  "01J8REST100",
		TableID:       "01J8TABLE04",
		Status:        "Payment Confirmed",
		PaymentStatus: "paid",
		TotalAmount:   650.00,
	}, internalorder.OrderStatusHistory{
		FromStatus: "Checkout",
		ToStatus:   "Payment Confirmed",
		ActorRole:  "guest",
		ActorID:    "guest:anonymous",
	})

	// 1. Guest Cancel Pre-Received (Success)
	cancelPayload := map[string]string{
		"order_id": created.ID,
	}
	body, _ := json.Marshal(cancelPayload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/orders/cancel", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	handler.HandleCancelOrder(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for guest pre-received cancel, got %d", rec.Code)
	}

	var resp map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &resp)

	if resp["status"] != "Cancelled" {
		t.Errorf("expected status Cancelled, got %v", resp["status"])
	}
}

func TestGuestPostReceivedCancelConflict(t *testing.T) {
	repo := internalorder.NewMemoryRepository()
	handler := internalorder.NewHandler(repo)

	// Create order in Preparing status
	created, _ := repo.CreateOrder(context.Background(), internalorder.OrderEntity{
		RestaurantID:  "01J8REST100",
		TableID:       "01J8TABLE04",
		Status:        "Preparing",
		PaymentStatus: "paid",
		TotalAmount:   650.00,
	}, internalorder.OrderStatusHistory{
		FromStatus: "Received",
		ToStatus:   "Preparing",
		ActorRole:  "kitchen",
		ActorID:    "01J8CHEF100",
	})

	// Guest attempts to cancel order in Preparing status (Must return 409 Conflict per FR-15)
	cancelPayload := map[string]string{
		"order_id": created.ID,
	}
	body, _ := json.Marshal(cancelPayload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/orders/cancel", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	handler.HandleCancelOrder(rec, req)

	if rec.Code != http.StatusConflict {
		t.Fatalf("expected status 409 Conflict for guest cancel while Preparing, got %d", rec.Code)
	}
}
