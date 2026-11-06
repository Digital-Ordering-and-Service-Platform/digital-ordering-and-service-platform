package payment

import (
	"context"
	"time"
)

type InitiatePaymentRequest struct {
	PaymentID     string  `json:"payment_id"`
	OrderID       string  `json:"order_id"`
	RestaurantID  string  `json:"restaurant_id"`
	Amount        float64 `json:"amount"`
	Currency      string  `json:"currency"` // "ETB"
	CustomerPhone string  `json:"customer_phone,omitempty"`
	CallbackURL   string  `json:"callback_url"`
}

type InitiatePaymentResponse struct {
	PaymentID    string `json:"payment_id"`
	ProviderTxID string `json:"provider_tx_id"`
	CheckoutURL  string `json:"checkout_url"`
	Status       string `json:"status"` // "pending"
	Instruction  string `json:"instruction,omitempty"`
}

type PaymentStatus struct {
	PaymentID    string    `json:"payment_id"`
	ProviderTxID string    `json:"provider_tx_id"`
	Status       string    `json:"status"` // "pending" | "success" | "failed" | "refunded"
	Amount       float64   `json:"amount"`
	VerifiedAt   time.Time `json:"verified_at"`
}

type RefundResponse struct {
	PaymentID    string    `json:"payment_id"`
	ProviderTxID string    `json:"provider_tx_id"`
	RefundTxID   string    `json:"refund_tx_id"`
	Status       string    `json:"status"` // "refunded" | "refund_pending"
	Amount       float64   `json:"amount"`
	RefundedAt   time.Time `json:"refunded_at"`
}

type WebhookEvent struct {
	Provider     string    `json:"provider"`
	ProviderTxID string    `json:"provider_tx_id"`
	OrderID      string    `json:"order_id"`
	Status       string    `json:"status"`
	Amount       float64   `json:"amount"`
	RawPayload   string    `json:"raw_payload"`
	Timestamp    time.Time `json:"timestamp"`
}

// PaymentProvider decouples external payment services (Chapa, Telebirr, CBE) per AD-5.
type PaymentProvider interface {
	InitiatePayment(ctx context.Context, req InitiatePaymentRequest) (*InitiatePaymentResponse, error)
	VerifyPayment(ctx context.Context, providerTxID string) (*PaymentStatus, error)
	Refund(ctx context.Context, paymentID string, amount float64) (*RefundResponse, error)
	HandleWebhook(ctx context.Context, body []byte) (*WebhookEvent, error)
}
