package payment

import (
	"context"
	"fmt"
	"time"

	pkgpayment "menuflow/backend/pkg/payment"
)

type CBEProvider struct {
	MerchantCode string
}

func NewCBEProvider(merchantCode string) *CBEProvider {
	return &CBEProvider{MerchantCode: merchantCode}
}

func (c *CBEProvider) InitiatePayment(ctx context.Context, req pkgpayment.InitiatePaymentRequest) (*pkgpayment.InitiatePaymentResponse, error) {
	txID := fmt.Sprintf("CBE-TX-%d", time.Now().UnixNano())
	checkoutURL := fmt.Sprintf("https://apps.cbe.com.et/directpay/%s", txID)

	return &pkgpayment.InitiatePaymentResponse{
		PaymentID:    req.PaymentID,
		ProviderTxID: txID,
		CheckoutURL:  checkoutURL,
		Status:       "pending",
		Instruction:  "Redirecting to CBE Direct Banking...",
	}, nil
}

func (c *CBEProvider) VerifyPayment(ctx context.Context, providerTxID string) (*pkgpayment.PaymentStatus, error) {
	return &pkgpayment.PaymentStatus{
		ProviderTxID: providerTxID,
		Status:       "success",
		Amount:       1012.00,
		VerifiedAt:   time.Now().UTC(),
	}, nil
}

func (c *CBEProvider) Refund(ctx context.Context, paymentID string, amount float64) (*pkgpayment.RefundResponse, error) {
	// Provider without automated refund API -> surfaces to manual refund queue per FR-15
	return &pkgpayment.RefundResponse{
		PaymentID:    paymentID,
		ProviderTxID: "CBE-TX-SAMPLE",
		RefundTxID:   "MANUAL-QUEUE",
		Status:       "refund_pending",
		Amount:       amount,
		RefundedAt:   time.Now().UTC(),
	}, nil
}

func (c *CBEProvider) HandleWebhook(ctx context.Context, body []byte) (*pkgpayment.WebhookEvent, error) {
	return &pkgpayment.WebhookEvent{
		Provider:     "cbe",
		ProviderTxID: "CBE-TX-SAMPLE",
		Status:       "success",
		Amount:       1012.00,
		Timestamp:    time.Now().UTC(),
	}, nil
}
