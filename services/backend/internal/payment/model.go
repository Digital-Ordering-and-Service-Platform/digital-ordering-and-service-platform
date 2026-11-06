package payment

import "time"

type PaymentEntity struct {
	ID           string    `json:"id"`
	OrderID      string    `json:"order_id"`
	RestaurantID string    `json:"restaurant_id"`
	Provider     string    `json:"provider"` // chapa | telebirr | cbe | cash
	ProviderTxID string    `json:"provider_tx_id"`
	Amount       float64   `json:"amount"`
	Status       string    `json:"status"` // pending | success | failed | refunded
	CreatedAt    time.Time `json:"created_at"`
}

type InitiateRequest struct {
	OrderID       string  `json:"order_id"`
	Provider      string  `json:"provider"` // chapa | telebirr | cbe | cash
	Amount        float64 `json:"amount"`
	CustomerPhone string  `json:"customer_phone,omitempty"`
}
