package order

import (
	"context"
	"fmt"
	"sync"
	"time"
)

type Repository interface {
	CreateOrder(ctx context.Context, o OrderEntity, history OrderStatusHistory) (*OrderEntity, error)
	GetOrder(ctx context.Context, id string) (*OrderEntity, error)
	UpdateOrderStatus(ctx context.Context, id, fromStatus, toStatus, actorRole, actorID, reason string) (*OrderEntity, error)
}

type MemoryRepository struct {
	mu      sync.RWMutex
	orders  map[string]*OrderEntity
	history []OrderStatusHistory
}

func NewMemoryRepository() *MemoryRepository {
	return &MemoryRepository{
		orders:  make(map[string]*OrderEntity),
		history: make([]OrderStatusHistory, 0),
	}
}

func (r *MemoryRepository) CreateOrder(ctx context.Context, o OrderEntity, history OrderStatusHistory) (*OrderEntity, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	orderID := fmt.Sprintf("01J8ORD%d", time.Now().UnixNano())
	o.ID = orderID
	o.CreatedAt = time.Now().UTC()

	for i := range o.Items {
		o.Items[i].ID = fmt.Sprintf("01J8ORDITEM%d", time.Now().UnixNano()+int64(i))
		o.Items[i].OrderID = orderID
	}

	r.orders[orderID] = &o

	// Append atomic status audit entry per AD-6
	history.ID = fmt.Sprintf("01J8HIST%d", time.Now().UnixNano())
	history.OrderID = orderID
	history.CreatedAt = time.Now().UTC()
	r.history = append(r.history, history)

	return &o, nil
}

func (r *MemoryRepository) GetOrder(ctx context.Context, id string) (*OrderEntity, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	o, exists := r.orders[id]
	if !exists {
		return nil, fmt.Errorf("order: record %s not found", id)
	}

	return o, nil
}

func (r *MemoryRepository) UpdateOrderStatus(ctx context.Context, id, fromStatus, toStatus, actorRole, actorID, reason string) (*OrderEntity, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	o, exists := r.orders[id]
	if !exists {
		return nil, fmt.Errorf("order: record %s not found", id)
	}

	o.Status = toStatus

	history := OrderStatusHistory{
		ID:         fmt.Sprintf("01J8HIST%d", time.Now().UnixNano()),
		OrderID:    id,
		FromStatus: fromStatus,
		ToStatus:   toStatus,
		ActorRole:  actorRole,
		ActorID:    actorID,
		Reason:     reason,
		CreatedAt:  time.Now().UTC(),
	}

	r.history = append(r.history, history)
	return o, nil
}
