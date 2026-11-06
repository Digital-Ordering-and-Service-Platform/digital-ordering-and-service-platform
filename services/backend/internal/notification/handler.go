package notification

import (
	"encoding/json"
	"net/http"
	"time"

	pkgauth "menuflow/backend/pkg/auth"
	pkgmw "menuflow/backend/pkg/middleware"
	pkgws "menuflow/backend/pkg/websocket"
)

type DeliverRequest struct {
	OrderID      string `json:"order_id"`
	RestaurantID string `json:"restaurant_id,omitempty"`
}

type Handler struct {
	router      *Router
	serviceRepo ServiceRequestRepository
	hub         *pkgws.Hub
}

func NewHandler(router *Router, serviceRepo ServiceRequestRepository, hub *pkgws.Hub) *Handler {
	return &Handler{
		router:      router,
		serviceRepo: serviceRepo,
		hub:         hub,
	}
}

// HandleDeliverOrder processes POST /api/v1/waiter/deliver per FR-12 & FR-17
func (h *Handler) HandleDeliverOrder(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req DeliverRequest
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
	if req.RestaurantID != "" {
		restaurantID = req.RestaurantID
	} else if rid, ok := r.Context().Value(pkgmw.TenantIDKey).(string); ok && rid != "" {
		restaurantID = rid
	}

	waiterID := "01J8WAITER000000000000001"
	if claims, ok := r.Context().Value(pkgmw.StaffClaimsKey).(*pkgauth.StaffClaims); ok && claims != nil {
		waiterID = claims.Sub
	}

	deliveredPayload := map[string]interface{}{
		"message":      "Order delivered to table successfully",
		"order_id":     req.OrderID,
		"status":       "Delivered",
		"delivered_by": waiterID,
		"delivered_at": time.Now().UTC(),
	}

	// Broadcast live order delivery to KDS, Waiter, and Guest tracker
	if h.hub != nil {
		_ = h.hub.Broadcast("restaurant:"+restaurantID+":waiter", "order.delivered", deliveredPayload)
		_ = h.hub.Broadcast("restaurant:"+restaurantID+":kds", "order.delivered", deliveredPayload)
		_ = h.hub.Broadcast("order:"+req.OrderID+":status", "order.delivered", deliveredPayload)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(deliveredPayload)
}

// HandleCreateServiceRequest processes POST /api/v1/guest/service-request
func (h *Handler) HandleCreateServiceRequest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload CreateServiceRequestPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	if payload.RestaurantID == "" {
		payload.RestaurantID = "01J8RESTAURANT000000000001"
	}
	if payload.TableLabel == "" && payload.TableID != "" {
		payload.TableLabel = payload.TableID
	}
	if payload.RequestType == "" {
		payload.RequestType = "call_waiter"
	}

	reqEntity := ServiceRequest{
		RestaurantID: payload.RestaurantID,
		TableID:      payload.TableID,
		TableLabel:   payload.TableLabel,
		RequestType:  payload.RequestType,
		Details:      payload.Details,
	}

	if h.serviceRepo == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Service repository not configured"})
		return
	}

	created, err := h.serviceRepo.Create(r.Context(), reqEntity)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Broadcast live assistance alert to waiter handheld and dashboard
	if h.hub != nil {
		_ = h.hub.Broadcast("restaurant:"+payload.RestaurantID+":waiter", "service.requested", created)
		_ = h.hub.Broadcast("restaurant:"+payload.RestaurantID+":admin", "service.requested", created)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(created)
}

// HandleGetServiceRequests processes GET /api/v1/waiter/service-requests
func (h *Handler) HandleGetServiceRequests(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	restaurantID := "01J8RESTAURANT000000000001"
	if rid := r.URL.Query().Get("restaurant_id"); rid != "" {
		restaurantID = rid
	}

	if h.serviceRepo == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{"requests": []ServiceRequest{}})
		return
	}

	activeRequests, err := h.serviceRepo.GetActive(r.Context(), restaurantID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"requests": activeRequests,
		"total":    len(activeRequests),
	})
}

// HandleUpdateServiceRequest processes PATCH /api/v1/waiter/service-requests
func (h *Handler) HandleUpdateServiceRequest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch && r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	reqID := r.URL.Query().Get("id")
	if reqID == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "id query param is required"})
		return
	}

	var payload UpdateServiceRequestPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	waiterID := payload.ResolvedBy
	if waiterID == "" {
		waiterID = "01J8WAITER000000000000001"
	}

	updated, err := h.serviceRepo.UpdateStatus(r.Context(), reqID, payload.Status, waiterID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	if h.hub != nil {
		_ = h.hub.Broadcast("restaurant:"+updated.RestaurantID+":waiter", "service.updated", updated)
		_ = h.hub.Broadcast("restaurant:"+updated.RestaurantID+":admin", "service.updated", updated)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updated)
}
