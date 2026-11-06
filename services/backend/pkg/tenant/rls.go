package tenant

import (
	"context"
	"database/sql"
	"fmt"
)

// WithTenantTx executes fn within a database transaction scoped to the given tenantID via RLS.
// It executes "SET LOCAL app.current_restaurant_id = $1" to bind the transaction session variable per AD-2.
func WithTenantTx(ctx context.Context, db *sql.DB, tenantID string, fn func(tx *sql.Tx) error) error {
	if tenantID == "" {
		return fmt.Errorf("rls: tenantID cannot be empty")
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("rls: failed to begin transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	// Execute SET LOCAL app.current_restaurant_id = $1 within the transaction block per AD-2
	query := fmt.Sprintf("SET LOCAL app.current_restaurant_id = '%s'", tenantID)
	if _, err := tx.ExecContext(ctx, query); err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("rls: failed to set tenant session variable: %w", err)
	}

	if err := fn(tx); err != nil {
		_ = tx.Rollback()
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("rls: failed to commit transaction: %w", err)
	}

	return nil
}
