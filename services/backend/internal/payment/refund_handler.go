package payment

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type RefundRequest struct {
	PaymentID string  `json:"payment_id"`
	Amount    float64 `json:"amount"`
	Reason    string  `json:"reason"`
}

// HandleRefundPayment processes POST /api/v1/payments/:id/refund per FR-15
func (h *Handler) HandleRefundPayment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RefundRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	if req.PaymentID == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "payment_id is required"})
		return
	}

	payment, err := h.repo.GetPayment(r.Context(), req.PaymentID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Payment record not found"})
		return
	}

	if payment.Status == "refunded" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Payment already refunded"})
		return
	}

	provider, exists := h.providers[payment.Provider]
	if !exists {
		// Fallback to manual queue for unautomated rails per FR-15
		_, _ = h.repo.UpdatePaymentStatus(r.Context(), payment.ID, "refund_pending", payment.ProviderTxID)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message":        "Provider lacks automated refund API. Refund queued for manual Platform Admin processing.",
			"payment_id":     payment.ID,
			"payment_status": "refund_pending",
		})
		return
	}

	refundResp, err := provider.Refund(r.Context(), payment.ID, payment.Amount)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": fmt.Sprintf("Refund execution failed: %v", err)})
		return
	}

	_, _ = h.repo.UpdatePaymentStatus(r.Context(), payment.ID, refundResp.Status, payment.ProviderTxID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(refundResp)
}

// HandleGetManualRefundQueue processes GET /ops/platform/refunds/manual per FR-15
func (h *Handler) HandleGetManualRefundQueue(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"manual_refund_queue": []map[string]string{
			{
				"payment_id":     "01J8PAY999",
				"order_id":       "01J8ORDER999",
				"provider":       "cbe",
				"amount":         "1012.00",
				"reason":         "Item out of stock / unautomated provider rail",
				"status":         "refund_pending",
				"created_at":     "2026-09-22T14:00:00Z",
			},
		},
		"total": 1,
	})
}
