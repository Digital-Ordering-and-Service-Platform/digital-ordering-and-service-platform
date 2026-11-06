package menu

import (
	"context"
	"fmt"
	"sync"
	"time"
)

type Repository interface {
	CreateCategory(ctx context.Context, restaurantID string, cat MenuCategory) (*MenuCategory, error)
	CreateItem(ctx context.Context, restaurantID string, item MenuItem) (*MenuItem, error)
	BulkUpdatePrices(ctx context.Context, restaurantID string, req BulkPriceUpdateRequest) (int, error)
	GetCatalog(ctx context.Context, restaurantID string) (*MenuCatalog, error)
	ToggleAvailability(ctx context.Context, restaurantID, itemID string, available bool) (*MenuItem, error)
}

type MemoryRepository struct {
	mu         sync.RWMutex
	categories map[string]*MenuCategory // catID -> MenuCategory
	items      map[string]*MenuItem     // itemID -> MenuItem
}

func NewMemoryRepository() *MemoryRepository {
	return &MemoryRepository{
		categories: make(map[string]*MenuCategory),
		items:      make(map[string]*MenuItem),
	}
}

func (r *MemoryRepository) CreateCategory(ctx context.Context, restaurantID string, cat MenuCategory) (*MenuCategory, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	catID := fmt.Sprintf("01J8CAT%d", time.Now().UnixNano())
	cat.ID = catID
	cat.RestaurantID = restaurantID
	cat.CreatedAt = time.Now().UTC()

	r.categories[catID] = &cat
	return &cat, nil
}

func (r *MemoryRepository) CreateItem(ctx context.Context, restaurantID string, item MenuItem) (*MenuItem, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	itemID := fmt.Sprintf("01J8ITEM%d", time.Now().UnixNano())
	item.ID = itemID
	item.RestaurantID = restaurantID
	item.CreatedAt = time.Now().UTC()

	if item.AllergenTags == nil {
		item.AllergenTags = []string{}
	}

	for i := range item.Options {
		item.Options[i].ID = fmt.Sprintf("01J8OPT%d", time.Now().UnixNano()+int64(i))
		item.Options[i].MenuItemID = itemID
		item.Options[i].RestaurantID = restaurantID
	}

	r.items[itemID] = &item
	return &item, nil
}

func (r *MemoryRepository) BulkUpdatePrices(ctx context.Context, restaurantID string, req BulkPriceUpdateRequest) (int, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	updatedCount := 0
	targetIDs := make(map[string]bool)
	for _, id := range req.ItemIDs {
		targetIDs[id] = true
	}

	for id, item := range r.items {
		if item.RestaurantID == restaurantID && (len(targetIDs) == 0 || targetIDs[id]) {
			if req.AdjustmentPercent != 0 {
				item.Price = item.Price * (1 + req.AdjustmentPercent/100.0)
			}
			if req.FixedDeltaETB != 0 {
				item.Price += req.FixedDeltaETB
			}
			updatedCount++
		}
	}

	return updatedCount, nil
}

func (r *MemoryRepository) ToggleAvailability(ctx context.Context, restaurantID, itemID string, available bool) (*MenuItem, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	item, exists := r.items[itemID]
	if !exists || item.RestaurantID != restaurantID {
		return nil, fmt.Errorf("menu: item %s not found for restaurant %s", itemID, restaurantID)
	}

	item.IsAvailable = available
	return item, nil
}

func (r *MemoryRepository) GetCatalog(ctx context.Context, restaurantID string) (*MenuCatalog, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	cats := make([]MenuCategory, 0)
	for _, cat := range r.categories {
		if cat.RestaurantID == restaurantID {
			c := *cat
			c.Items = make([]MenuItem, 0)
			for _, item := range r.items {
				if item.CategoryID == cat.ID {
					c.Items = append(c.Items, *item)
				}
			}
			cats = append(cats, c)
		}
	}

	return &MenuCatalog{
		RestaurantID: restaurantID,
		Categories:   cats,
		UpdatedAt:    time.Now().UTC(),
	}, nil
}
