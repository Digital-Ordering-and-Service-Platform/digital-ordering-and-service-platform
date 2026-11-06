package tenant

import "time"

// Restaurant represents a tenant on the MenuFlow platform.
type Restaurant struct {
	ID                  string    `json:"id"`
	Name                string    `json:"name"`
	EstablishmentMode   string    `json:"establishment_mode"` // table_service | self_service
	ServiceChargePct    float64   `json:"service_charge_pct"`
	VATPct              float64   `json:"vat_pct"`
	CashFallbackEnabled bool      `json:"cash_fallback_enabled"`
	PickupAlarmEnabled  bool      `json:"pickup_alarm_enabled"`
	TokenVersion        int       `json:"token_version"`
	CreatedAt           time.Time `json:"created_at"`
}

// TableEntity represents a physical table or takeaway pickup point per AD-3.
type TableEntity struct {
	ID           string    `json:"id"`
	RestaurantID string    `json:"restaurant_id"`
	TableNumber  string    `json:"table_number"` // e.g. "T04" or "P04"
	Type         string    `json:"type"`         // "table" | "pickup"
	QRToken      string    `json:"qr_token,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

// CreateTableRequest payload for creating a new table or pickup point.
type CreateTableRequest struct {
	TableNumber string `json:"table_number"`
	Type        string `json:"type"` // "table" | "pickup"
}

// OnboardRestaurantRequest contains the payload for creating a new restaurant tenant and initial admin user.
type OnboardRestaurantRequest struct {
	Name                string  `json:"name"`
	EstablishmentMode   string  `json:"establishment_mode"` // table_service | self_service
	ServiceChargePct    float64 `json:"service_charge_pct"`
	VATPct              float64 `json:"vat_pct"`
	CashFallbackEnabled bool    `json:"cash_fallback_enabled"`
	AdminEmail          string  `json:"admin_email"`
	AdminPassword       string  `json:"admin_password"`
	AdminName           string  `json:"admin_name"`
}

// SubscriptionUpdateState contains the payload for updating a tenant's billing status.
type SubscriptionUpdateState struct {
	Plan   string `json:"plan"`   // starter | pro | enterprise
	Status string `json:"status"` // active | suspended | trial
}
