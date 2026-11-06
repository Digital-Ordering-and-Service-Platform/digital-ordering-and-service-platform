package payment

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	pkgmw "menuflow/backend/pkg/middleware"
	pkgpayment "menuflow/backend/pkg/payment"
)

type SettleCashRequest struct {
	OrderID string `json:"order_id"`
}

type Handler struct {
	repo      Repository
	providers map[string]pkgpayment.PaymentProvider
}

func NewHandler(repo Repository) *Handler {
	providers := map[string]pkgpayment.PaymentProvider{
		"chapa":    NewChapaProvider("chapa_secret_key_demo"),
		"telebirr": NewTelebirrProvider("telebirr_app_id_demo"),
		"cbe":      NewCBEProvider("cbe_merchant_code_demo"),
	}

	return &Handler{
		repo:      repo,
		providers: providers,
	}
}

// HandleInitiatePayment processes POST /api/v1/payments/initiate per FR-8
func (h *Handler) HandleInitiatePayment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req InitiateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	if req.OrderID == "" || req.Provider == "" || req.Amount <= 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "order_id, provider, and amount > 0 are required"})
		return
	}

	provider, exists := h.providers[req.Provider]
	if !exists && req.Provider != "cash" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": fmt.Sprintf("Unsupported payment provider: %s", req.Provider)})
		return
	}

	// 1. Create Payment record in DB
	paymentEntity, err := h.repo.CreatePayment(r.Context(), PaymentEntity{
		OrderID:      req.OrderID,
		RestaurantID: "01J8RESTAURANT000000000001",
		Provider:     req.Provider,
		Amount:       req.Amount,
		Status:       "pending",
	})
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// 2. Cash Fallback path per FR-10
	if req.Provider == "cash" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"payment_id":  paymentEntity.ID,
			"provider":    "cash",
			"status":      "pending",
			"instruction": "Order submitted. Please pay cashier directly at counter when order is ready.",
		})
		return
	}

	// 3. Digital Rail hosted checkout path per FR-8
	providerResp, err := provider.InitiatePayment(r.Context(), pkgpayment.InitiatePaymentRequest{
		PaymentID:     paymentEntity.ID,
		OrderID:       req.OrderID,
		RestaurantID:  paymentEntity.RestaurantID,
		Amount:        req.Amount,
		Currency:      "ETB",
		CustomerPhone: req.CustomerPhone,
		CallbackURL:   fmt.Sprintf("https://menuflow.et/api/v1/payments/verify/%s", paymentEntity.ID),
	})
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(map[string]string{"error": fmt.Sprintf("Payment provider error: %v", err)})
		return
	}

	_, _ = h.repo.UpdatePaymentStatus(r.Context(), paymentEntity.ID, "pending", providerResp.ProviderTxID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(providerResp)
}

// HandleVerifyPayment processes GET /api/v1/payments/:id/verify for dual-rail fallback polling per AD-5
func (h *Handler) HandleVerifyPayment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	paymentID := r.URL.Query().Get("id")
	if paymentID == "" {
		paymentID = strings.TrimPrefix(r.URL.Path, "/api/v1/payments/verify/")
	}

	payment, err := h.repo.GetPayment(r.Context(), paymentID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Payment record not found"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"payment_id":     payment.ID,
		"order_id":       payment.OrderID,
		"status":         payment.Status,
		"provider":       payment.Provider,
		"provider_tx_id": payment.ProviderTxID,
		"amount":         payment.Amount,
	})
}

// HandleCashierSettle processes POST /api/v1/cashier/settle per FR-10 & FR-14
func (h *Handler) HandleCashierSettle(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SettleCashRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	if req.OrderID == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "order_id is required"})
		return
	}

	restaurantID := "01J8RESTAURANT000000000001"
	if rid, ok := r.Context().Value(pkgmw.TenantIDKey).(string); ok && rid != "" {
		restaurantID = rid
	}

	// Create settled cash payment record
	payment, err := h.repo.CreatePayment(r.Context(), PaymentEntity{
		OrderID:      req.OrderID,
		RestaurantID: restaurantID,
		Provider:     "cash",
		ProviderTxID: fmt.Sprintf("CASH-SETTLE-%s", req.OrderID),
		Amount:       900.00,
		Status:       "paid",
	})
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":        "Order marked as paid & settled by cashier",
		"payment_id":     payment.ID,
		"payment_status": "paid",
	})
}
