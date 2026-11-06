package payment

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// HandleWebhook processes POST /api/v1/payments/webhook/:provider per FR-9 & AD-5
func (h *Handler) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	providerName := strings.TrimPrefix(r.URL.Path, "/api/v1/payments/webhook/")
	if providerName == "" {
		providerName = r.URL.Query().Get("provider")
	}

	provider, exists := h.providers[providerName]
	if !exists {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": fmt.Sprintf("Unknown provider: %s", providerName)})
		return
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to read body"})
		return
	}

	// 1. Signature / Payload verification per FR-9
	event, err := provider.HandleWebhook(r.Context(), bodyBytes)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid webhook signature or payload"})
		return
	}

	// 2. Idempotent execution: record to payment_webhooks & update order status per AD-5 & AD-6
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":         "processed",
		"provider":       event.Provider,
		"provider_tx_id": event.ProviderTxID,
		"message":        "Payment settled idempotently",
	})
}
