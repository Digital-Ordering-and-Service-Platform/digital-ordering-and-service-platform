package payment

import (
	"context"
	"fmt"
	"time"

	pkgpayment "menuflow/backend/pkg/payment"
)

type ChapaProvider struct {
	APIKey string
}

func NewChapaProvider(apiKey string) *ChapaProvider {
	return &ChapaProvider{APIKey: apiKey}
}

func (c *ChapaProvider) InitiatePayment(ctx context.Context, req pkgpayment.InitiatePaymentRequest) (*pkgpayment.InitiatePaymentResponse, error) {
	txID := fmt.Sprintf("CHP-TX-%d", time.Now().UnixNano())
	checkoutURL := fmt.Sprintf("https://checkout.chapa.co/checkout/web/payment/%s", txID)

	return &pkgpayment.InitiatePaymentResponse{
		PaymentID:    req.PaymentID,
		ProviderTxID: txID,
		CheckoutURL:  checkoutURL,
		Status:       "pending",
		Instruction:  "Redirecting to Chapa hosted checkout...",
	}, nil
}

func (c *ChapaProvider) VerifyPayment(ctx context.Context, providerTxID string) (*pkgpayment.PaymentStatus, error) {
	return &pkgpayment.PaymentStatus{
		ProviderTxID: providerTxID,
		Status:       "success",
		Amount:       1012.00,
		VerifiedAt:   time.Now().UTC(),
	}, nil
}

func (c *ChapaProvider) Refund(ctx context.Context, paymentID string, amount float64) (*pkgpayment.RefundResponse, error) {
	refundTxID := fmt.Sprintf("CHP-RF-%d", time.Now().UnixNano())
	return &pkgpayment.RefundResponse{
		PaymentID:    paymentID,
		ProviderTxID: "CHP-TX-SAMPLE",
		RefundTxID:   refundTxID,
		Status:       "refunded",
		Amount:       amount,
		RefundedAt:   time.Now().UTC(),
	}, nil
}

func (c *ChapaProvider) HandleWebhook(ctx context.Context, body []byte) (*pkgpayment.WebhookEvent, error) {
	return &pkgpayment.WebhookEvent{
		Provider:     "chapa",
		ProviderTxID: "CHP-TX-SAMPLE",
		Status:       "success",
		Amount:       1012.00,
		Timestamp:    time.Now().UTC(),
	}, nil
}
