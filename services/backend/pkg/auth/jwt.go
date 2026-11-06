package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// StaffClaims holds the JWT claims required by AD-9: sub (user_id), rid (restaurant_id), role.
type StaffClaims struct {
	Sub  string `json:"sub"`  // Staff User ULID
	Rid  string `json:"rid"`  // Restaurant Tenant ULID
	Role string `json:"role"` // admin | cashier | kitchen | waiter
	Exp  int64  `json:"exp"`  // Expiration timestamp
	Iat  int64  `json:"iat"`  // Issued at timestamp
}

// GenerateJWT creates an HMAC-SHA256 signed JWT token string.
func GenerateJWT(secretKey string, claims StaffClaims, ttl time.Duration) (string, error) {
	if secretKey == "" {
		return "", fmt.Errorf("jwt: secret key cannot be empty")
	}

	now := time.Now().UTC()
	claims.Iat = now.Unix()
	claims.Exp = now.Add(ttl).Unix()

	header := map[string]string{
		"alg": "HS256",
		"typ": "JWT",
	}

	headerJSON, err := json.Marshal(header)
	if err != nil {
		return "", err
	}

	claimsJSON, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}

	headerEnc := base64.RawURLEncoding.EncodeToString(headerJSON)
	claimsEnc := base64.RawURLEncoding.EncodeToString(claimsJSON)

	unsignedToken := fmt.Sprintf("%s.%s", headerEnc, claimsEnc)

	h := hmac.New(sha256.New, []byte(secretKey))
	h.Write([]byte(unsignedToken))
	sig := base64.RawURLEncoding.EncodeToString(h.Sum(nil))

	return fmt.Sprintf("%s.%s", unsignedToken, sig), nil
}

// ParseJWT validates an HMAC-SHA256 signed JWT token string and returns its StaffClaims.
func ParseJWT(secretKey, tokenStr string) (*StaffClaims, error) {
	if secretKey == "" || tokenStr == "" {
		return nil, fmt.Errorf("jwt: invalid input token or key")
	}

	parts := strings.Split(tokenStr, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("jwt: invalid token format")
	}

	unsignedToken := fmt.Sprintf("%s.%s", parts[0], parts[1])
	h := hmac.New(sha256.New, []byte(secretKey))
	h.Write([]byte(unsignedToken))
	expectedSig := base64.RawURLEncoding.EncodeToString(h.Sum(nil))

	if !hmac.Equal([]byte(parts[2]), []byte(expectedSig)) {
		return nil, fmt.Errorf("jwt: invalid signature")
	}

	claimsBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("jwt: failed to decode claims: %w", err)
	}

	var claims StaffClaims
	if err := json.Unmarshal(claimsBytes, &claims); err != nil {
		return nil, fmt.Errorf("jwt: failed to unmarshal claims: %w", err)
	}

	if time.Now().UTC().Unix() > claims.Exp {
		return nil, fmt.Errorf("jwt: token has expired")
	}

	return &claims, nil
}
