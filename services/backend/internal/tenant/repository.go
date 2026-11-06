package tenant

import (
	"context"
	"fmt"
	"sync"
	"time"

	pkgauth "menuflow/backend/pkg/auth"
)

type Repository interface {
	CreateTenant(ctx context.Context, req OnboardRestaurantRequest) (*Restaurant, *pkgauth.StaffClaims, error)
	GetTenant(ctx context.Context, id string) (*Restaurant, error)
	ListTenants(ctx context.Context) ([]Restaurant, error)
	UpdateSubscription(ctx context.Context, id string, update SubscriptionUpdateState) (*Restaurant, error)
	CreateTable(ctx context.Context, restaurantID string, req CreateTableRequest) (*TableEntity, error)
	ListTables(ctx context.Context, restaurantID string) ([]TableEntity, error)
	IncrementTokenVersion(ctx context.Context, restaurantID string) (int, error)
	UpdateSettings(ctx context.Context, restaurantID string, settings Restaurant) (*Restaurant, error)
}

type MemoryRepository struct {
	mu          sync.RWMutex
	restaurants map[string]*Restaurant
	tables      map[string]*TableEntity
	emails      map[string]string // email -> restaurant_id
}

func NewMemoryRepository() *MemoryRepository {
	return &MemoryRepository{
		restaurants: make(map[string]*Restaurant),
		tables:      make(map[string]*TableEntity),
		emails:      make(map[string]string),
	}
}

func (r *MemoryRepository) CreateTenant(ctx context.Context, req OnboardRestaurantRequest) (*Restaurant, *pkgauth.StaffClaims, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.emails[req.AdminEmail]; exists {
		return nil, nil, fmt.Errorf("tenant: email %s is already registered", req.AdminEmail)
	}

	restID := fmt.Sprintf("01J8REST%d", time.Now().UnixNano())
	adminID := fmt.Sprintf("01J8ADMIN%d", time.Now().UnixNano())

	mode := req.EstablishmentMode
	if mode == "" {
		mode = "table_service"
	}

	rest := &Restaurant{
		ID:                  restID,
		Name:                req.Name,
		EstablishmentMode:   mode,
		ServiceChargePct:    req.ServiceChargePct,
		VATPct:              req.VATPct,
		CashFallbackEnabled: req.CashFallbackEnabled,
		PickupAlarmEnabled:  false,
		TokenVersion:        1,
		CreatedAt:           time.Now().UTC(),
	}

	r.restaurants[restID] = rest
	r.emails[req.AdminEmail] = restID

	claims := &pkgauth.StaffClaims{
		Sub:  adminID,
		Rid:  restID,
		Role: "admin",
	}

	return rest, claims, nil
}

func (r *MemoryRepository) GetTenant(ctx context.Context, id string) (*Restaurant, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	rest, exists := r.restaurants[id]
	if !exists {
		// Provide default mock tenant for testing
		return &Restaurant{
			ID:                  id,
			Name:                "Habesha Gourmet Cafe",
			EstablishmentMode:   "table_service",
			ServiceChargePct:    10.0,
			VATPct:              15.0,
			CashFallbackEnabled: true,
			PickupAlarmEnabled:  false,
			TokenVersion:        1,
		}, nil
	}

	return rest, nil
}

func (r *MemoryRepository) ListTenants(ctx context.Context) ([]Restaurant, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	list := make([]Restaurant, 0, len(r.restaurants))
	for _, rest := range r.restaurants {
		list = append(list, *rest)
	}
	return list, nil
}

func (r *MemoryRepository) UpdateSubscription(ctx context.Context, id string, update SubscriptionUpdateState) (*Restaurant, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	rest, exists := r.restaurants[id]
	if !exists {
		return nil, fmt.Errorf("tenant: restaurant with id %s not found", id)
	}

	return rest, nil
}

func (r *MemoryRepository) CreateTable(ctx context.Context, restaurantID string, req CreateTableRequest) (*TableEntity, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	tableID := fmt.Sprintf("01J8TABLE%d", time.Now().UnixNano())
	tblType := req.Type
	if tblType == "" {
		tblType = "table"
	}

	tbl := &TableEntity{
		ID:           tableID,
		RestaurantID: restaurantID,
		TableNumber:  req.TableNumber,
		Type:         tblType,
		CreatedAt:    time.Now().UTC(),
	}

	r.tables[tableID] = tbl
	return tbl, nil
}

func (r *MemoryRepository) ListTables(ctx context.Context, restaurantID string) ([]TableEntity, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	list := make([]TableEntity, 0)
	for _, tbl := range r.tables {
		if tbl.RestaurantID == restaurantID {
			list = append(list, *tbl)
		}
	}
	return list, nil
}

func (r *MemoryRepository) IncrementTokenVersion(ctx context.Context, restaurantID string) (int, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	rest, exists := r.restaurants[restaurantID]
	if !exists {
		rest = &Restaurant{ID: restaurantID, TokenVersion: 1}
		r.restaurants[restaurantID] = rest
	}

	rest.TokenVersion++
	return rest.TokenVersion, nil
}

func (r *MemoryRepository) UpdateSettings(ctx context.Context, restaurantID string, settings Restaurant) (*Restaurant, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	rest, exists := r.restaurants[restaurantID]
	if !exists {
		rest = &Restaurant{ID: restaurantID}
		r.restaurants[restaurantID] = rest
	}

	if settings.EstablishmentMode != "" {
		rest.EstablishmentMode = settings.EstablishmentMode
	}
	rest.ServiceChargePct = settings.ServiceChargePct
	rest.VATPct = settings.VATPct
	rest.CashFallbackEnabled = settings.CashFallbackEnabled
	rest.PickupAlarmEnabled = settings.PickupAlarmEnabled

	return rest, nil
}
