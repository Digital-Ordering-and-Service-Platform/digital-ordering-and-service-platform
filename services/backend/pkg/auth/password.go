package auth

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"fmt"
)

// HashPassword hashes a raw password string with a salt using SHA-256.
func HashPassword(password, salt string) string {
	hash := sha256.New()
	hash.Write([]byte(salt + password))
	return hex.EncodeToString(hash.Sum(nil))
}

// CheckPasswordHash compares a raw password against a salted hash in constant time.
func CheckPasswordHash(password, salt, storedHash string) bool {
	computedHash := HashPassword(password, salt)
	return subtle.ConstantTimeCompare([]byte(computedHash), []byte(storedHash)) == 1
}

// FormatStoredHash formats salt and hash as "salt:hash"
func FormatStoredHash(salt, hash string) string {
	return fmt.Sprintf("%s:%s", salt, hash)
}
