package menu

import "time"

type ItemOption struct {
	ID           string    `json:"id"`
	MenuItemID   string    `json:"menu_item_id"`
	RestaurantID string    `json:"restaurant_id"`
	NameEN       string    `json:"name_en"`
	NameAM       string    `json:"name_am"`
	PriceDelta   float64   `json:"price_delta"`
	Type         string    `json:"type"` // addon | removal | variant
	CreatedAt    time.Time `json:"created_at"`
}

type MenuItem struct {
	ID              string       `json:"id"`
	CategoryID      string       `json:"category_id"`
	RestaurantID    string       `json:"restaurant_id"`
	NameEN          string       `json:"name_en"`
	NameAM          string       `json:"name_am"`
	DescriptionEN   string       `json:"description_en"`
	DescriptionAM   string       `json:"description_am"`
	Price           float64      `json:"price"`
	IsAvailable     bool         `json:"is_available"`
	PrepTimeMinutes int          `json:"prep_time_minutes"`
	AllergenTags    []string     `json:"allergen_tags"`
	Options         []ItemOption `json:"options,omitempty"`
	CreatedAt       time.Time    `json:"created_at"`
}

type MenuCategory struct {
	ID           string     `json:"id"`
	RestaurantID string     `json:"restaurant_id"`
	NameEN       string     `json:"name_en"`
	NameAM       string     `json:"name_am"`
	SortOrder    int        `json:"sort_order"`
	Items        []MenuItem `json:"items,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}

type MenuCatalog struct {
	RestaurantID string         `json:"restaurant_id"`
	Categories   []MenuCategory `json:"categories"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

type BulkPriceUpdateRequest struct {
	ItemIDs           []string `json:"item_ids"`
	AdjustmentPercent float64  `json:"adjustment_percent,omitempty"`
	FixedDeltaETB     float64  `json:"fixed_delta_etb,omitempty"`
}
