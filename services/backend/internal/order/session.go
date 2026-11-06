package order

import (
	"context"
	"fmt"
	"math"
	"sync"
	"time"
)

type TableRound struct {
	RoundNumber int         `json:"round_number"`
	OrderID     string      `json:"order_id"`
	Status      string      `json:"status"` // Received | Preparing | Ready | Delivered
	Items       []OrderItem `json:"items"`
	SubmittedAt time.Time   `json:"submitted_at"`
}

type TableSession struct {
	ID                  string       `json:"id"`
	RestaurantID        string       `json:"restaurant_id"`
	TableID             string       `json:"table_id"`
	TableLabel          string       `json:"table_label"`
	Status              string       `json:"status"`         // "active" | "bill_requested" | "paid" | "closed"
	PaymentStatus       string       `json:"payment_status"` // "unpaid" | "paid"
	PaymentProvider     string       `json:"payment_provider,omitempty"`
	BankReference       string       `json:"bank_reference,omitempty"`
	Subtotal            float64      `json:"subtotal"`
	ServiceChargeAmount float64      `json:"service_charge_amount"` // 10%
	TaxAmount           float64      `json:"tax_amount"`            // 15% VAT
	TotalAmount         float64      `json:"total_amount"`
	Rounds              []TableRound `json:"rounds"`
	OpenedAt            time.Time    `json:"opened_at"`
	ClosedAt            *time.Time   `json:"closed_at,omitempty"`
}

type TableBillResponse struct {
	SessionID           string       `json:"session_id"`
	RestaurantID        string       `json:"restaurant_id"`
	TableID             string       `json:"table_id"`
	TableLabel          string       `json:"table_label"`
	Status              string       `json:"status"`
	PaymentStatus       string       `json:"payment_status"`
	PaymentProvider     string       `json:"payment_provider,omitempty"`
	BankReference       string       `json:"bank_reference,omitempty"`
	Subtotal            float64      `json:"subtotal"`
	ServiceChargeAmount float64      `json:"service_charge_amount"`
	TaxAmount           float64      `json:"tax_amount"`
	TotalAmount         float64      `json:"total_amount"`
	AllItems            []OrderItem  `json:"all_items"`
	Rounds              []TableRound `json:"rounds"`
	OpenedAt            time.Time    `json:"opened_at"`
	ClosedAt            *time.Time   `json:"closed_at,omitempty"`
}

type SubmitRoundRequest struct {
	RestaurantID string      `json:"restaurant_id"`
	TableID      string      `json:"table_id"`
	TableLabel   string      `json:"table_label,omitempty"`
	Items        []OrderItem `json:"items"`
}

type SettleBillRequest struct {
	Provider      string `json:"provider"` // telebirr | chapa | cbe | cash
	BankReference string `json:"bank_reference,omitempty"`
}

type SessionRepository interface {
	GetOrCreateActiveSession(ctx context.Context, restaurantID, tableID, tableLabel string) (*TableSession, error)
	GetActiveSession(ctx context.Context, restaurantID, tableID string) (*TableSession, error)
	AddRound(ctx context.Context, sessionID string, round TableRound) (*TableSession, error)
	SettleBill(ctx context.Context, sessionID, provider, bankRef string) (*TableSession, error)
	RequestBill(ctx context.Context, sessionID string) (*TableSession, error)
}

type MemorySessionRepository struct {
	mu       sync.RWMutex
	sessions map[string]*TableSession            // sessionID -> TableSession
	active   map[string]string                   // "rid:tableID" -> sessionID
}

func NewMemorySessionRepository() *MemorySessionRepository {
	return &MemorySessionRepository{
		sessions: make(map[string]*TableSession),
		active:   make(map[string]string),
	}
}

func (r *MemorySessionRepository) GetOrCreateActiveSession(ctx context.Context, restaurantID, tableID, tableLabel string) (*TableSession, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	key := fmt.Sprintf("%s:%s", restaurantID, tableID)
	if sessID, exists := r.active[key]; exists {
		if s, ok := r.sessions[sessID]; ok && s.Status != "closed" && s.Status != "paid" {
			return s, nil
		}
	}

	if tableLabel == "" {
		tableLabel = "Table " + tableID
	}

	now := time.Now().UTC()
	sessID := fmt.Sprintf("01J8SESS%d", now.UnixNano())
	newSession := &TableSession{
		ID:                  sessID,
		RestaurantID:        restaurantID,
		TableID:             tableID,
		TableLabel:          tableLabel,
		Status:              "active",
		PaymentStatus:       "unpaid",
		Subtotal:            0,
		ServiceChargeAmount: 0,
		TaxAmount:           0,
		TotalAmount:         0,
		Rounds:              make([]TableRound, 0),
		OpenedAt:            now,
	}

	r.sessions[sessID] = newSession
	r.active[key] = sessID
	return newSession, nil
}

func (r *MemorySessionRepository) GetActiveSession(ctx context.Context, restaurantID, tableID string) (*TableSession, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	key := fmt.Sprintf("%s:%s", restaurantID, tableID)
	sessID, exists := r.active[key]
	if !exists {
		return nil, fmt.Errorf("session: no active table session found for table %s", tableID)
	}

	s, ok := r.sessions[sessID]
	if !ok || s.Status == "closed" {
		return nil, fmt.Errorf("session: table session %s is closed", sessID)
	}

	return s, nil
}

func (r *MemorySessionRepository) AddRound(ctx context.Context, sessionID string, round TableRound) (*TableSession, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	s, exists := r.sessions[sessionID]
	if !exists {
		return nil, fmt.Errorf("session: record %s not found", sessionID)
	}

	round.RoundNumber = len(s.Rounds) + 1
	round.SubmittedAt = time.Now().UTC()
	s.Rounds = append(s.Rounds, round)

	// Recalculate consolidated subtotal
	var subtotal float64
	for _, rnd := range s.Rounds {
		for _, it := range rnd.Items {
			subtotal += it.UnitPrice * float64(it.Quantity)
		}
	}

	s.Subtotal = subtotal
	s.ServiceChargeAmount = math.Round(subtotal*0.10*100) / 100 // 10% Service Surcharge
	s.TaxAmount = math.Round(subtotal*0.15*100) / 100           // 15% VAT
	s.TotalAmount = math.Round((s.Subtotal+s.ServiceChargeAmount+s.TaxAmount)*100) / 100

	return s, nil
}

func (r *MemorySessionRepository) RequestBill(ctx context.Context, sessionID string) (*TableSession, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	s, exists := r.sessions[sessionID]
	if !exists {
		return nil, fmt.Errorf("session: record %s not found", sessionID)
	}

	s.Status = "bill_requested"
	return s, nil
}

func (r *MemorySessionRepository) SettleBill(ctx context.Context, sessionID, provider, bankRef string) (*TableSession, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	s, exists := r.sessions[sessionID]
	if !exists {
		return nil, fmt.Errorf("session: record %s not found", sessionID)
	}

	now := time.Now().UTC()
	s.Status = "paid"
	s.PaymentStatus = "paid"
	s.PaymentProvider = provider
	s.BankReference = bankRef
	s.ClosedAt = &now

	// Remove from active lookup so future orders start fresh
	key := fmt.Sprintf("%s:%s", s.RestaurantID, s.TableID)
	delete(r.active, key)

	return s, nil
}
