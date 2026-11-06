package kds

import (
	"encoding/json"
	"net/http"

	pkgmw "menuflow/backend/pkg/middleware"
	pkgws "menuflow/backend/pkg/websocket"
)

type StatusUpdateRequest struct {
	FromStatus string `json:"from_status"`
	ToStatus   string `json:"to_status"`
}

type Handler struct {
	repo Repository
	hub  *pkgws.Hub
}

func NewHandler(repo Repository, hub *pkgws.Hub) *Handler {
	return &Handler{
		repo: repo,
		hub:  hub,
	}
}

// HandleGetActiveOrders processes GET /api/v1/kds/orders/active per FR-11
func (h *Handler) HandleGetActiveOrders(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	restaurantID := "01J8RESTAURANT000000000001"
	if rid, ok := r.Context().Value(pkgmw.TenantIDKey).(string); ok && rid != "" {
		restaurantID = rid
	}

	orders, err := h.repo.GetActiveOrders(r.Context(), restaurantID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch active KDS orders"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"active_orders": orders,
		"total":         len(orders),
	})
}

// HandleUpdateStatus processes PATCH /api/v1/kds/orders/:id/status per FR-12 & AD-6
func (h *Handler) HandleUpdateStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	orderID := r.URL.Query().Get("id")
	if orderID == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "id query param is required"})
		return
	}

	var req StatusUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	restaurantID := "01J8RESTAURANT000000000001"
	if rid, ok := r.Context().Value(pkgmw.TenantIDKey).(string); ok && rid != "" {
		restaurantID = rid
	}

	updated, err := h.repo.UpdateOrderStatus(r.Context(), restaurantID, orderID, req.FromStatus, req.ToStatus)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// 1. Broadcast status update via WebSocket hub Redis Pub/Sub topic per AD-4
	topic := "restaurant:" + restaurantID + ":kds"
	if h.hub != nil {
		_ = h.hub.Broadcast(topic, "kds.order.status_updated", updated)
		_ = h.hub.Broadcast("order:"+orderID+":status", "order.status_updated", updated)
		if req.ToStatus == "Ready" {
			_ = h.hub.Broadcast("restaurant:"+restaurantID+":waiter", "order.ready", updated)
		}
	}

	// 2. Record event in Redis Stream (events:restaurant:{rid}) for sequence replay per AD-8
	_ = pkgws.RecordEvent("events:"+topic, "kds.order.status_updated", updated)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updated)
}

// HandleGetKDSEvents processes GET /api/v1/kds/events?since_id=... for disconnect replay per AD-8
func (h *Handler) HandleGetKDSEvents(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	restaurantID := "01J8RESTAURANT000000000001"
	if rid, ok := r.Context().Value(pkgmw.TenantIDKey).(string); ok && rid != "" {
		restaurantID = rid
	}

	sinceID := r.URL.Query().Get("since_id")
	topic := "events:restaurant:" + restaurantID + ":kds"

	events, ok := pkgws.GetEventsSince(topic, sinceID)
	if !ok {
		// Buffer expired (>60s disconnect) -> 410 Gone triggering full snapshot reload per AD-8
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusGone)
		json.NewEncoder(w).Encode(map[string]string{
			"error":        "Event sequence buffer expired. Re-fetch full active snapshot.",
			"fallback_url": "/api/v1/kds/orders/active",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"events": events,
		"total":  len(events),
	})
}
