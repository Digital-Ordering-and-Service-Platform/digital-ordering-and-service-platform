package kds

import "time"

type KDSItem struct {
	ID                  string   `json:"id"`
	NameEN              string   `json:"name_en"`
	NameAM              string   `json:"name_am"`
	Quantity            int      `json:"quantity"`
	Options             []string `json:"options"`
	SpecialInstructions string   `json:"special_instructions"`
}

type KDSOrderCard struct {
	ID            string    `json:"id"`
	OrderRef      string    `json:"order_ref"` // e.g. "MF-8942-T4"
	RestaurantID  string    `json:"restaurant_id"`
	TableLabel    string    `json:"table_label"` // e.g. "Table 04" or "Pickup #P04"
	TableType     string    `json:"table_type"`  // "table" | "pickup"
	Status        string    `json:"status"`      // Received | Preparing | Ready
	PaymentStatus string    `json:"payment_status"` // paid | unpaid
	Items         []KDSItem `json:"items"`
	ElapsedMins   int       `json:"elapsed_mins"`
	IsOverdue     bool      `json:"is_overdue"`
	CreatedAt     time.Time `json:"created_at"`
}
