package payment

import (
	"context"
	"fmt"
	"time"

	pkgpayment "menuflow/backend/pkg/payment"
)

type TelebirrProvider struct {
	AppID string
}

func NewTelebirrProvider(appID string) *TelebirrProvider {
	return &TelebirrProvider{AppID: appID}
}

func (t *TelebirrProvider) InitiatePayment(ctx context.Context, req pkgpayment.InitiatePaymentRequest) (*pkgpayment.InitiatePaymentResponse, error) {
	txID := fmt.Sprintf("TLB-TX-%d", time.Now().UnixNano())
	checkoutURL := fmt.Sprintf("https://pay.telebirr.et/h5/pay?tx=%s", txID)

	return &pkgpayment.InitiatePaymentResponse{
		PaymentID:    req.PaymentID,
		ProviderTxID: txID,
		CheckoutURL:  checkoutURL,
		Status:       "pending",
		Instruction:  "Initiating Telebirr Push... Check your phone for USSD confirmation",
	}, nil
}

func (t *TelebirrProvider) VerifyPayment(ctx context.Context, providerTxID string) (*pkgpayment.PaymentStatus, error) {
	return &pkgpayment.PaymentStatus{
		ProviderTxID: providerTxID,
		Status:       "success",
		Amount:       1012.00,
		VerifiedAt:   time.Now().UTC(),
	}, nil
}

func (t *TelebirrProvider) Refund(ctx context.Context, paymentID string, amount float64) (*pkgpayment.RefundResponse, error) {
	refundTxID := fmt.Sprintf("TLB-RF-%d", time.Now().UnixNano())
	return &pkgpayment.RefundResponse{
		PaymentID:    paymentID,
		ProviderTxID: "TLB-TX-SAMPLE",
		RefundTxID:   refundTxID,
		Status:       "refunded",
		Amount:       amount,
		RefundedAt:   time.Now().UTC(),
	}, nil
}

func (t *TelebirrProvider) HandleWebhook(ctx context.Context, body []byte) (*pkgpayment.WebhookEvent, error) {
	return &pkgpayment.WebhookEvent{
		Provider:     "telebirr",
		ProviderTxID: "TLB-TX-SAMPLE",
		Status:       "success",
		Amount:       1012.00,
		Timestamp:    time.Now().UTC(),
	}, nil
}
