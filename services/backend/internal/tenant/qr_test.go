package tenant_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	internaltenant "menuflow/backend/internal/tenant"
	pkgtenant "menuflow/backend/pkg/tenant"
)

const qrTestSecret = "super-secret-qr-key-32-bytes!!!"

func TestHMACQRTokenGenerationAndRevocation(t *testing.T) {
	// 1. Generate Token
	payload := pkgtenant.QRTokenPayload{
		RestaurantID: "01J8REST100",
		Type:         "table",
		TargetID:     "01J8TABLE100",
		Label:        "T04",
		Version:      1,
	}

	tokenStr, err := pkgtenant.GenerateQRToken(qrTestSecret, payload)
	if err != nil {
		t.Fatalf("failed to generate QR token: %v", err)
	}

	// 2. Verify Valid Token
	parsed, err := pkgtenant.ParseAndVerifyQRToken(qrTestSecret, tokenStr, 1)
	if err != nil {
		t.Fatalf("failed to verify valid QR token: %v", err)
	}

	if parsed.TargetID != payload.TargetID || parsed.Label != payload.Label {
		t.Errorf("parsed payload mismatch: got %+v, want %+v", parsed, payload)
	}

	// 3. Verify Revocation on Version Salt Mismatch (FR-2, AD-3)
	_, errRevoked := pkgtenant.ParseAndVerifyQRToken(qrTestSecret, tokenStr, 2) // Version incremented to 2
	if errRevoked == nil {
		t.Fatalf("expected error verifying revoked token with version salt 2, got nil")
	}
}

func TestCreateTableAndRegenerateHandler(t *testing.T) {
	repo := internaltenant.NewMemoryRepository()
	handler := internaltenant.NewHandler(repo, qrTestSecret)

	// 1. Create Table
	tblPayload := internaltenant.CreateTableRequest{
		TableNumber: "T04",
		Type:        "table",
	}
	body, _ := json.Marshal(tblPayload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/tables", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	handler.HandleCreateTable(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status 201 Created, got %d", rec.Code)
	}

	var createdTbl internaltenant.TableEntity
	json.Unmarshal(rec.Body.Bytes(), &createdTbl)

	if createdTbl.QRToken == "" {
		t.Errorf("expected generated QR token in response")
	}

	// 2. Regenerate Token (Revoke old tokens)
	reqRegen := httptest.NewRequest(http.MethodPost, "/api/v1/admin/tables/regenerate-token", nil)
	recRegen := httptest.NewRecorder()

	handler.HandleRegenerateTokens(recRegen, reqRegen)

	if recRegen.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for token regeneration, got %d", recRegen.Code)
	}
}
