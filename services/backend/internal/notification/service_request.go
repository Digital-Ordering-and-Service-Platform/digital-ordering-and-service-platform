package notification

import (
	"context"
	"fmt"
	"sync"
	"time"
)

type ServiceRequest struct {
	ID           string     `json:"id"`
	RestaurantID string     `json:"restaurant_id"`
	TableID      string     `json:"table_id"`
	TableLabel   string     `json:"table_label"`
	RequestType  string     `json:"request_type"` // "call_waiter", "water", "cutlery", "bill", "issue"
	Details      string     `json:"details,omitempty"`
	Status       string     `json:"status"` // "pending", "in_progress", "resolved"
	CreatedAt    time.Time  `json:"created_at"`
	ResolvedAt   *time.Time `json:"resolved_at,omitempty"`
	ResolvedBy   string     `json:"resolved_by,omitempty"`
}

type CreateServiceRequestPayload struct {
	RestaurantID string `json:"restaurant_id"`
	TableID      string `json:"table_id"`
	TableLabel   string `json:"table_label"`
	RequestType  string `json:"request_type"`
	Details      string `json:"details,omitempty"`
}

type UpdateServiceRequestPayload struct {
	Status     string `json:"status"` // "in_progress", "resolved"
	ResolvedBy string `json:"resolved_by,omitempty"`
}

type ServiceRequestRepository interface {
	Create(ctx context.Context, req ServiceRequest) (*ServiceRequest, error)
	GetActive(ctx context.Context, restaurantID string) ([]ServiceRequest, error)
	UpdateStatus(ctx context.Context, id, status, resolvedBy string) (*ServiceRequest, error)
}

type MemoryServiceRequestRepository struct {
	mu       sync.RWMutex
	requests map[string]*ServiceRequest
}

func NewMemoryServiceRequestRepository() *MemoryServiceRequestRepository {
	return &MemoryServiceRequestRepository{
		requests: make(map[string]*ServiceRequest),
	}
}

func (r *MemoryServiceRequestRepository) Create(ctx context.Context, req ServiceRequest) (*ServiceRequest, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	req.ID = fmt.Sprintf("01J8REQ%d", time.Now().UnixNano())
	req.Status = "pending"
	req.CreatedAt = time.Now().UTC()
	r.requests[req.ID] = &req
	return &req, nil
}

func (r *MemoryServiceRequestRepository) GetActive(ctx context.Context, restaurantID string) ([]ServiceRequest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	active := make([]ServiceRequest, 0)
	for _, req := range r.requests {
		if req.RestaurantID == restaurantID && req.Status != "resolved" {
			active = append(active, *req)
		}
	}
	return active, nil
}

func (r *MemoryServiceRequestRepository) UpdateStatus(ctx context.Context, id, status, resolvedBy string) (*ServiceRequest, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	req, exists := r.requests[id]
	if !exists {
		return nil, fmt.Errorf("service request %s not found", id)
	}

	req.Status = status
	if status == "resolved" {
		now := time.Now().UTC()
		req.ResolvedAt = &now
		req.ResolvedBy = resolvedBy
	}
	return req, nil
}
