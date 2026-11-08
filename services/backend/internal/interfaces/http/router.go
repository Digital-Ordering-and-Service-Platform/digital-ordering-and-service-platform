// Package http provides the HTTP interface for the API process.
package http

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

type healthResponse struct {
	Status    string    `json:"status"`
	Service   string    `json:"service"`
	Timestamp time.Time `json:"timestamp"`
}

type ReadinessCheck struct {
	Required bool
	Check    func(context.Context) error
}

type readinessResponse struct {
	Status       string                      `json:"status"`
	Service      string                      `json:"service"`
	Dependencies map[string]dependencyStatus `json:"dependencies"`
}

type dependencyStatus struct {
	Status   string `json:"status"`
	Required bool   `json:"required"`
}

// NewRouter builds the API router. Business routes are added alongside their
// application modules in later implementation phases.
func NewRouter() http.Handler {
	return NewRouterWithReadiness(nil, 2*time.Second)
}

// NewRouterWithReadiness adds dependency-aware readiness while preserving
// /healthz as a process-only liveness endpoint.
func NewRouterWithReadiness(checks map[string]ReadinessCheck, timeout time.Duration) http.Handler {
	router := chi.NewRouter()
	router.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(healthResponse{
			Status:    "ok",
			Service:   "digital-ordering-api",
			Timestamp: time.Now().UTC(),
		})
	})
	router.Get("/readyz", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), timeout)
		defer cancel()
		response := readinessResponse{Status: "ready", Service: "digital-ordering-api", Dependencies: make(map[string]dependencyStatus, len(checks))}
		code := http.StatusOK
		for name, dependency := range checks {
			status := dependencyStatus{Status: "unavailable", Required: dependency.Required}
			if dependency.Check != nil && dependency.Check(ctx) == nil {
				status.Status = "ok"
			}
			if dependency.Required && status.Status != "ok" {
				response.Status = "not_ready"
				code = http.StatusServiceUnavailable
			}
			response.Dependencies[name] = status
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(code)
		_ = json.NewEncoder(w).Encode(response)
	})
	return router
}
