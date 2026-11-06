package order

import (
	"context"
	"testing"
)

func TestTableSessionMultiRoundAndSettlement(t *testing.T) {
	ctx := context.Background()
	repo := NewMemorySessionRepository()

	sess, err := repo.GetOrCreateActiveSession(ctx, "01J8REST01", "04", "Table 04")
	if err != nil {
		t.Fatalf("failed to create session: %v", err)
	}

	if sess.TableID != "04" || sess.Status != "active" {
		t.Errorf("expected active session on Table 04, got %s, status %s", sess.TableID, sess.Status)
	}

	// Add Round 1: 2 Shekla Tibs @ 480 ETB = 960 ETB
	r1 := TableRound{
		OrderID: "01JRND1",
		Items: []OrderItem{
			{MenuItemID: "Shekla Tibs", Quantity: 2, UnitPrice: 480.0},
		},
	}
	sess, err = repo.AddRound(ctx, sess.ID, r1)
	if err != nil {
		t.Fatalf("failed to add round 1: %v", err)
	}

	if len(sess.Rounds) != 1 {
		t.Fatalf("expected 1 round, got %d", len(sess.Rounds))
	}
	if sess.Subtotal != 960.0 {
		t.Errorf("expected subtotal 960.0, got %f", sess.Subtotal)
	}
	// Service charge 10% = 96, VAT 15% = 144, Total = 1200
	if sess.ServiceChargeAmount != 96.0 {
		t.Errorf("expected service charge 96.0, got %f", sess.ServiceChargeAmount)
	}
	if sess.TaxAmount != 144.0 {
		t.Errorf("expected tax amount 144.0, got %f", sess.TaxAmount)
	}
	if sess.TotalAmount != 1200.0 {
		t.Errorf("expected total 1200.0, got %f", sess.TotalAmount)
	}

	// Add Round 2: 3 St George Beers @ 70 ETB = 210 ETB
	r2 := TableRound{
		OrderID: "01JRND2",
		Items: []OrderItem{
			{MenuItemID: "St George Beer", Quantity: 3, UnitPrice: 70.0},
		},
	}
	sess, err = repo.AddRound(ctx, sess.ID, r2)
	if err != nil {
		t.Fatalf("failed to add round 2: %v", err)
	}

	if len(sess.Rounds) != 2 {
		t.Fatalf("expected 2 rounds, got %d", len(sess.Rounds))
	}
	// Subtotal = 960 + 210 = 1170
	if sess.Subtotal != 1170.0 {
		t.Errorf("expected subtotal 1170.0, got %f", sess.Subtotal)
	}
	// Service 10% = 117.0, Tax 15% = 175.50, Total = 1462.50
	if sess.ServiceChargeAmount != 117.0 {
		t.Errorf("expected service charge 117.0, got %f", sess.ServiceChargeAmount)
	}
	if sess.TaxAmount != 175.50 {
		t.Errorf("expected tax 175.50, got %f", sess.TaxAmount)
	}
	if sess.TotalAmount != 1462.50 {
		t.Errorf("expected total 1462.50, got %f", sess.TotalAmount)
	}

	// Request Bill
	sess, err = repo.RequestBill(ctx, sess.ID)
	if err != nil {
		t.Fatalf("failed to request bill: %v", err)
	}
	if sess.Status != "bill_requested" {
		t.Errorf("expected status bill_requested, got %s", sess.Status)
	}

	// Settle Bill with Telebirr
	sess, err = repo.SettleBill(ctx, sess.ID, "telebirr", "TB-839210")
	if err != nil {
		t.Fatalf("failed to settle bill: %v", err)
	}
	if sess.PaymentStatus != "paid" || sess.Status != "paid" {
		t.Errorf("expected status paid, got %s, payment status %s", sess.Status, sess.PaymentStatus)
	}
	if sess.PaymentProvider != "telebirr" || sess.BankReference != "TB-839210" {
		t.Errorf("unexpected payment metadata: %s, %s", sess.PaymentProvider, sess.BankReference)
	}

	// Verify active session for Table 04 is now reset (closed)
	_, err = repo.GetActiveSession(ctx, "01J8REST01", "04")
	if err == nil {
		t.Errorf("expected no active session after settlement, but found one")
	}
}
