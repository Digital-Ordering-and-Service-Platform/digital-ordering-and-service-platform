package order

import "time"

type OrderItem struct {
	ID                  string                 `json:"id"`
	OrderID             string                 `json:"order_id"`
	MenuItemID          string                 `json:"menu_item_id"`
	Quantity            int                    `json:"quantity"`
	UnitPrice           float64                `json:"unit_price"`
	SelectedOptions     map[string]interface{} `json:"selected_options"`
	SpecialInstructions string                 `json:"special_instructions"`
	CreatedAt           time.Time              `json:"created_at"`
}

type OrderEntity struct {
	ID                   string      `json:"id"`
	RestaurantID         string      `json:"restaurant_id"`
	TableID              string      `json:"table_id"`
	Status               string      `json:"status"`         // Received | Preparing | Ready | Notified | Delivered | Picked Up | Closed | Payment Pending | Payment Confirmed | Payment Failed | Cancelled
	PaymentStatus        string      `json:"payment_status"` // unpaid | paid | refund_pending
	Subtotal             float64     `json:"subtotal"`
	TaxAmount            float64     `json:"tax_amount"`
	ServiceChargeAmount  float64     `json:"service_charge_amount"`
	TotalAmount          float64     `json:"total_amount"`
	OrderIntentID        string      `json:"order_intent_id"`
	Items                []OrderItem `json:"items,omitempty"`
	CreatedAt            time.Time   `json:"created_at"`
}

type OrderStatusHistory struct {
	ID        string    `json:"id"`
	OrderID   string    `json:"order_id"`
	FromStatus string   `json:"from_status"`
	ToStatus   string   `json:"to_status"`
	ActorRole  string   `json:"actor_role"`
	ActorID    string   `json:"actor_id"`
	Reason     string   `json:"reason"`
	CreatedAt  time.Time `json:"created_at"`
}

type CreateOrderRequest struct {
	RestaurantID  string      `json:"restaurant_id"`
	TableID       string      `json:"table_id"`
	Provider      string      `json:"provider"` // cash | telebirr | chapa | cbe
	OrderIntentID string      `json:"order_intent_id"`
	Items         []OrderItem `json:"items"`
}
