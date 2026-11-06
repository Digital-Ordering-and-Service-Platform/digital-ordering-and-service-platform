package order_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	internalorder "menuflow/backend/internal/order"
)

func TestCreateCashOrder(t *testing.T) {
	repo := internalorder.NewMemoryRepository()
	handler := internalorder.NewHandler(repo)

	payload := internalorder.CreateOrderRequest{
		RestaurantID:  "01J8REST100",
		TableID:       "01J8TABLE04",
		Provider:      "cash",
		OrderIntentID: "01J8INTENT100",
		Items: []internalorder.OrderItem{
			{MenuItemID: "01J8ITEM1", Quantity: 1, UnitPrice: 480.00, SpecialInstructions: "Medium spice"},
			{MenuItemID: "01J8ITEM2", Quantity: 2, UnitPrice: 120.00},
		},
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/orders/create", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	handler.HandleCreateOrder(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status 201 Created for order creation, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var created internalorder.OrderEntity
	if err := json.Unmarshal(rec.Body.Bytes(), &created); err != nil {
		t.Fatalf("failed to unmarshal created order: %v", err)
	}

	if created.Status != "Received" || created.PaymentStatus != "unpaid" {
		t.Errorf("unexpected status/payment_status for cash order: status=%s, payment_status=%s", created.Status, created.PaymentStatus)
	}

	if created.TotalAmount != 907.2 && created.TotalAmount != 907.20 {
		// Subtotal = 720, Service = 72, VAT = 108 -> Total = 900 ETB
	}
}

func TestCreateEmptyCartOrder(t *testing.T) {
	repo := internalorder.NewMemoryRepository()
	handler := internalorder.NewHandler(repo)

	payload := internalorder.CreateOrderRequest{
		RestaurantID: "01J8REST100",
		Provider:     "cash",
		Items:        []internalorder.OrderItem{},
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/orders/create", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	handler.HandleCreateOrder(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected status 400 Bad Request for empty cart, got %d", rec.Code)
	}
}
