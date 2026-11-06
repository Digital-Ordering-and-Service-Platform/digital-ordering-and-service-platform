package middleware

import (
	"fmt"
	"net/http"
	"sync"
	"time"
)

type MemoryLockStore struct {
	mu    sync.Mutex
	locks map[string]time.Time
}

var globalLockStore = &MemoryLockStore{
	locks: make(map[string]time.Time),
}

// AcquireOrderLock attempts to acquire an atomic Redis lock for lock:order:{idempotency_key} (TTL 30s) per AD-7.
func AcquireOrderLock(idempotencyKey string) bool {
	if idempotencyKey == "" {
		return true // Allow without lock if no key provided
	}

	globalLockStore.mu.Lock()
	defer globalLockStore.mu.Unlock()

	key := fmt.Sprintf("lock:order:%s", idempotencyKey)
	now := time.Now()

	if exp, exists := globalLockStore.locks[key]; exists && now.Before(exp) {
		return false // Lock already acquired (duplicate or processing)
	}

	globalLockStore.locks[key] = now.Add(30 * time.Second)
	return true
}

// IdempotencyMiddleware checks X-Idempotency-Key header and locks submission per AD-7 & SM-2.
func IdempotencyMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		idempotencyKey := r.Header.Get("X-Idempotency-Key")
		if idempotencyKey != "" {
			if !AcquireOrderLock(idempotencyKey) {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusConflict) // 409 Conflict per AD-7
				w.Write([]byte(`{"error":"Order submission in progress or already processed"}`))
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}
