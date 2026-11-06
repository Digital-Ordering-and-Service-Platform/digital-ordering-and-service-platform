package tenant_test

import (
	"context"
	"database/sql"
	"testing"

	pkgtenant "menuflow/backend/pkg/tenant"
)

func TestWithTenantTx_EmptyTenantID(t *testing.T) {
	ctx := context.Background()
	err := pkgtenant.WithTenantTx(ctx, nil, "", func(tx *sql.Tx) error {
		return nil
	})

	if err == nil {
		t.Fatalf("expected error when passing empty tenantID, got nil")
	}
}
