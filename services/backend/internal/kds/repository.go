package kds

import (
	"context"
	"fmt"
	"sync"
	"time"
)

type Repository interface {
	GetActiveOrders(ctx context.Context, restaurantID string) ([]KDSOrderCard, error)
	UpdateOrderStatus(ctx context.Context, restaurantID, orderID, fromStatus, toStatus string) (*KDSOrderCard, error)
	AddOrder(ctx context.Context, card KDSOrderCard) (*KDSOrderCard, error)
}

type MemoryRepository struct {
	mu     sync.RWMutex
	orders map[string]*KDSOrderCard
}

func NewMemoryRepository() *MemoryRepository {
	now := time.Now().UTC()
	card := &KDSOrderCard{
		ID:            "01J8ORDKDS01",
		OrderRef:      "MF-8942-T4",
		RestaurantID:  "01J8RESTAURANT000000000001",
		TableLabel:    "Table 04",
		TableType:     "table",
		Status:        "Received",
		PaymentStatus: "paid",
		ElapsedMins:   4,
		IsOverdue:     false,
		CreatedAt:     now.Add(-4 * time.Minute),
		Items: []KDSItem{
			{
				ID:                  "01J8ITEM1",
				NameEN:              "Special Sizzling Shekla Tibs",
				NameAM:              "የሸክላ ጥብስ",
				Quantity:            1,
				Options:             []string{"Extra Injera (+30 ETB)"},
				SpecialInstructions: "Medium spice level",
			},
		},
	}

	m := make(map[string]*KDSOrderCard)
	m[card.ID] = card

	return &MemoryRepository{
		orders: m,
	}
}

func (r *MemoryRepository) GetActiveOrders(ctx context.Context, restaurantID string) ([]KDSOrderCard, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	active := make([]KDSOrderCard, 0)
	for _, o := range r.orders {
		if o.RestaurantID == restaurantID && (o.Status == "Received" || o.Status == "Preparing" || o.Status == "Ready") {
			active = append(active, *o)
		}
	}
	return active, nil
}

func (r *MemoryRepository) UpdateOrderStatus(ctx context.Context, restaurantID, orderID, fromStatus, toStatus string) (*KDSOrderCard, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	o, exists := r.orders[orderID]
	if !exists || o.RestaurantID != restaurantID {
		return nil, fmt.Errorf("kds: order %s not found for restaurant %s", orderID, restaurantID)
	}

	// Validate state machine transitions per AD-6 & FR-12
	if (fromStatus == "Received" && toStatus != "Preparing") ||
		(fromStatus == "Preparing" && toStatus != "Ready") {
		return nil, fmt.Errorf("kds: invalid state transition from %s to %s", fromStatus, toStatus)
	}

	o.Status = toStatus
	return o, nil
}

func (r *MemoryRepository) AddOrder(ctx context.Context, card KDSOrderCard) (*KDSOrderCard, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.orders[card.ID] = &card
	return &card, nil
}

