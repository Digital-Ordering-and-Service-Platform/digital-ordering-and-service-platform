package payment

import (
	"context"
	"fmt"
	"sync"
	"time"
)

type Repository interface {
	CreatePayment(ctx context.Context, p PaymentEntity) (*PaymentEntity, error)
	GetPayment(ctx context.Context, id string) (*PaymentEntity, error)
	UpdatePaymentStatus(ctx context.Context, id, status, providerTxID string) (*PaymentEntity, error)
}

type MemoryRepository struct {
	mu       sync.RWMutex
	payments map[string]*PaymentEntity
}

func NewMemoryRepository() *MemoryRepository {
	return &MemoryRepository{
		payments: make(map[string]*PaymentEntity),
	}
}

func (r *MemoryRepository) CreatePayment(ctx context.Context, p PaymentEntity) (*PaymentEntity, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	payID := fmt.Sprintf("01J8PAY%d", time.Now().UnixNano())
	p.ID = payID
	p.CreatedAt = time.Now().UTC()
	if p.Status == "" {
		p.Status = "pending"
	}

	r.payments[payID] = &p
	return &p, nil
}

func (r *MemoryRepository) GetPayment(ctx context.Context, id string) (*PaymentEntity, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	p, exists := r.payments[id]
	if !exists {
		return nil, fmt.Errorf("payment: record %s not found", id)
	}

	return p, nil
}

func (r *MemoryRepository) UpdatePaymentStatus(ctx context.Context, id, status, providerTxID string) (*PaymentEntity, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	p, exists := r.payments[id]
	if !exists {
		return nil, fmt.Errorf("payment: record %s not found", id)
	}

	p.Status = status
	if providerTxID != "" {
		p.ProviderTxID = providerTxID
	}

	return p, nil
}
