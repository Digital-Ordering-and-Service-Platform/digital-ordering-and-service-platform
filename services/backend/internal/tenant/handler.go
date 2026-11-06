package tenant

import (
	"encoding/json"
	"net/http"
	"strings"

	pkgmw "menuflow/backend/pkg/middleware"
	pkgtenant "menuflow/backend/pkg/tenant"
)

type Handler struct {
	repo      Repository
	secretKey string
}

func NewHandler(repo Repository, secretKey string) *Handler {
	return &Handler{
		repo:      repo,
		secretKey: secretKey,
	}
}

// HandleOnboardTenant processes POST /ops/platform/restaurants
func (h *Handler) HandleOnboardTenant(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req OnboardRestaurantRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request payload"})
		return
	}

	if req.Name == "" || req.AdminEmail == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Restaurant name and admin_email are required"})
		return
	}

	rest, claims, err := h.repo.CreateTenant(r.Context(), req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		if strings.Contains(err.Error(), "already registered") {
			w.WriteHeader(http.StatusConflict)
		} else {
			w.WriteHeader(http.StatusInternalServerError)
		}
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":    "Restaurant onboarded successfully",
		"restaurant": rest,
		"admin_user": claims,
	})
}

// HandleListTenants processes GET /ops/platform/restaurants
func (h *Handler) HandleListTenants(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	tenants, err := h.repo.ListTenants(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to list tenants"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"restaurants": tenants,
		"total":       len(tenants),
	})
}

// HandleUpdateBilling processes PATCH /ops/platform/restaurants/:id/billing
func (h *Handler) HandleUpdateBilling(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Missing restaurant id query param"})
		return
	}

	var update SubscriptionUpdateState
	if err := json.NewDecoder(r.Body).Decode(&update); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid update payload"})
		return
	}

	rest, err := h.repo.UpdateSubscription(r.Context(), id, update)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":    "Subscription updated",
		"restaurant": rest,
	})
}

// HandleCreateTable processes POST /api/v1/admin/tables
func (h *Handler) HandleCreateTable(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreateTableRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request payload"})
		return
	}

	if req.TableNumber == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "table_number is required"})
		return
	}

	restaurantID := "01J8RESTAURANT000000000001"
	if rid, ok := r.Context().Value(pkgmw.TenantIDKey).(string); ok && rid != "" {
		restaurantID = rid
	}

	rest, _ := h.repo.GetTenant(r.Context(), restaurantID)
	version := 1
	if rest != nil {
		version = rest.TokenVersion
	}

	tbl, err := h.repo.CreateTable(r.Context(), restaurantID, req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Generate HMAC-SHA256 signed QR token per AD-3
	tokenStr, _ := pkgtenant.GenerateQRToken(h.secretKey, pkgtenant.QRTokenPayload{
		RestaurantID: restaurantID,
		Type:         tbl.Type,
		TargetID:     tbl.ID,
		Label:        tbl.TableNumber,
		Version:      version,
	})

	tbl.QRToken = tokenStr

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(tbl)
}

// HandleRegenerateTokens processes POST /api/v1/admin/tables/regenerate-token per FR-2
func (h *Handler) HandleRegenerateTokens(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	restaurantID := "01J8RESTAURANT000000000001"
	if rid, ok := r.Context().Value(pkgmw.TenantIDKey).(string); ok && rid != "" {
		restaurantID = rid
	}

	newVersion, err := h.repo.IncrementTokenVersion(r.Context(), restaurantID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":           "All previous QR tokens revoked successfully",
		"new_token_version": newVersion,
	})
}

// HandleGetSettings processes GET /api/v1/admin/settings per FR-18
func (h *Handler) HandleGetSettings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	restaurantID := "01J8RESTAURANT000000000001"
	if rid, ok := r.Context().Value(pkgmw.TenantIDKey).(string); ok && rid != "" {
		restaurantID = rid
	}

	rest, err := h.repo.GetTenant(r.Context(), restaurantID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(rest)
}

// HandleUpdateSettings processes PUT /api/v1/admin/settings per FR-18
func (h *Handler) HandleUpdateSettings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	restaurantID := "01J8RESTAURANT000000000001"
	if rid, ok := r.Context().Value(pkgmw.TenantIDKey).(string); ok && rid != "" {
		restaurantID = rid
	}

	var req Restaurant
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request payload"})
		return
	}

	updated, err := h.repo.UpdateSettings(r.Context(), restaurantID, req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":  "Establishment settings updated successfully",
		"settings": updated,
	})
}

// HandleResolveQRToken processes GET /api/v1/guest/qr/resolve per FR-1 & AD-3
func (h *Handler) HandleResolveQRToken(w http.ResponseWriter, r *http.Request) {
	tokenStr := r.URL.Query().Get("token")
	if tokenStr == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "QR token is required"})
		return
	}

	// 1. Decode token payload first to read tenant ID
	tempPayload, err := pkgtenant.ParseAndVerifyQRToken(h.secretKey, tokenStr, -1)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid or revoked QR token"})
		return
	}

	// 2. Fetch current tenant token_version salt
	rest, _ := h.repo.GetTenant(r.Context(), tempPayload.RestaurantID)
	currentVersion := 1
	if rest != nil {
		currentVersion = rest.TokenVersion
	}

	// 3. Verify HMAC signature & current token_version salt per AD-3
	payload, err := pkgtenant.ParseAndVerifyQRToken(h.secretKey, tokenStr, currentVersion)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "This menu link is no longer active"})
		return
	}

	restaurantName := "Habesha Gourmet Cafe"
	if rest != nil && rest.Name != "" {
		restaurantName = rest.Name
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"restaurant_id":   payload.RestaurantID,
		"restaurant_name": restaurantName,
		"type":            payload.Type,
		"target_id":       payload.TargetID,
		"label":           payload.Label,
	})
}
