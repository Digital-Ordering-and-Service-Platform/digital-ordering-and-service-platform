package menu

import (
	"encoding/json"
	"net/http"

	pkgmw "menuflow/backend/pkg/middleware"
)

type Handler struct {
	repo  Repository
	cache *Cache
}

func NewHandler(repo Repository, cache *Cache) *Handler {
	return &Handler{
		repo:  repo,
		cache: cache,
	}
}

// HandleGetGuestMenu processes GET /api/v1/guest/menu with Redis cache menu:{rid} per AD-10
func (h *Handler) HandleGetGuestMenu(w http.ResponseWriter, r *http.Request) {
	restaurantID := r.URL.Query().Get("restaurant_id")
	if restaurantID == "" {
		if rid, ok := r.Context().Value(pkgmw.TenantIDKey).(string); ok && rid != "" {
			restaurantID = rid
		} else {
			restaurantID = "01J8RESTAURANT000000000001" // Demo fallback
		}
	}

	// 1. Check Redis cache hit per AD-10
	cached, err := h.cache.GetCatalog(r.Context(), restaurantID)
	if err == nil && cached != nil {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Cache", "HIT")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(cached)
		return
	}

	// 2. Cache miss -> query Postgres repository & populate cache
	catalog, err := h.repo.GetCatalog(r.Context(), restaurantID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch menu catalog"})
		return
	}

	_ = h.cache.SetCatalog(r.Context(), restaurantID, catalog)

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Cache", "MISS")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(catalog)
}

// HandleCreateCategory processes POST /api/v1/admin/menu/categories
func (h *Handler) HandleCreateCategory(w http.ResponseWriter, r *http.Request) {
	var cat MenuCategory
	if err := json.NewDecoder(r.Body).Decode(&cat); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	if cat.NameEN == "" && cat.NameAM == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Category name_en or name_am is required"})
		return
	}

	restaurantID := "01J8RESTAURANT000000000001"
	if rid, ok := r.Context().Value(pkgmw.TenantIDKey).(string); ok && rid != "" {
		restaurantID = rid
	}

	created, err := h.repo.CreateCategory(r.Context(), restaurantID, cat)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Invalidate Redis cache on menu mutation per AD-10
	h.cache.InvalidateCatalog(r.Context(), restaurantID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(created)
}

// HandleCreateItem processes POST /api/v1/admin/menu/items
func (h *Handler) HandleCreateItem(w http.ResponseWriter, r *http.Request) {
	var item MenuItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	if item.CategoryID == "" || (item.NameEN == "" && item.NameAM == "") {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "category_id and item name are required"})
		return
	}

	restaurantID := "01J8RESTAURANT000000000001"
	if rid, ok := r.Context().Value(pkgmw.TenantIDKey).(string); ok && rid != "" {
		restaurantID = rid
	}

	created, err := h.repo.CreateItem(r.Context(), restaurantID, item)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Invalidate Redis cache on menu mutation per AD-10
	h.cache.InvalidateCatalog(r.Context(), restaurantID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(created)
}

// HandleBulkPrices processes POST /api/v1/admin/menu/prices/bulk
func (h *Handler) HandleBulkPrices(w http.ResponseWriter, r *http.Request) {
	var req BulkPriceUpdateRequest
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

	count, err := h.repo.BulkUpdatePrices(r.Context(), restaurantID, req)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	h.cache.InvalidateCatalog(r.Context(), restaurantID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":       "Bulk prices updated successfully",
		"items_updated": count,
	})
}
