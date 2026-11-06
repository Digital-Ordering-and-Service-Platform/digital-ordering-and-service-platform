package tenant

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
)

// QRTokenPayload defines the HMAC-signed payload structure required by AD-3.
type QRTokenPayload struct {
	RestaurantID string `json:"rid"`       // Restaurant ULID
	Type         string `json:"type"`      // "table" | "pickup"
	TargetID     string `json:"target_id"` // Table or Pickup ULID
	Label        string `json:"label"`     // e.g. "T04" or "P04"
	Version      int    `json:"v"`         // Tenant token version salt
}

// GenerateQRToken generates an HMAC-SHA256 signed QR token string.
func GenerateQRToken(secretKey string, payload QRTokenPayload) (string, error) {
	if secretKey == "" {
		return "", fmt.Errorf("qr_token: secret key cannot be empty")
	}

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("qr_token: failed to marshal payload: %w", err)
	}

	payloadEnc := base64.RawURLEncoding.EncodeToString(payloadJSON)

	h := hmac.New(sha256.New, []byte(secretKey))
	h.Write([]byte(payloadEnc))
	sig := base64.RawURLEncoding.EncodeToString(h.Sum(nil))

	return fmt.Sprintf("%s.%s", payloadEnc, sig), nil
}

// ParseAndVerifyQRToken verifies HMAC signature and current token_version salt per AD-3.
func ParseAndVerifyQRToken(secretKey, tokenStr string, currentVersion int) (*QRTokenPayload, error) {
	if secretKey == "" || tokenStr == "" {
		return nil, fmt.Errorf("qr_token: invalid token or secret key")
	}

	parts := strings.Split(tokenStr, ".")
	if len(parts) != 2 {
		return nil, fmt.Errorf("qr_token: invalid token format")
	}

	h := hmac.New(sha256.New, []byte(secretKey))
	h.Write([]byte(parts[0]))
	expectedSig := base64.RawURLEncoding.EncodeToString(h.Sum(nil))

	if !hmac.Equal([]byte(parts[1]), []byte(expectedSig)) {
		return nil, fmt.Errorf("qr_token: invalid HMAC signature")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, fmt.Errorf("qr_token: failed to decode payload: %w", err)
	}

	var payload QRTokenPayload
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return nil, fmt.Errorf("qr_token: failed to unmarshal payload: %w", err)
	}

	// Verify token version salt matches current restaurant version per AD-3 & FR-2
	if currentVersion > 0 && payload.Version != currentVersion {
		return nil, fmt.Errorf("qr_token: token has been revoked (version mismatch)")
	}

	return &payload, nil
}
