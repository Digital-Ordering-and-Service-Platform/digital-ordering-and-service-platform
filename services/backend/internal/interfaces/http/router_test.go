package http

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestHealthz(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	response := httptest.NewRecorder()

	NewRouter().ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}
	if contentType := response.Header().Get("Content-Type"); contentType != "application/json" {
		t.Fatalf("Content-Type = %q, want application/json", contentType)
	}

	var body struct {
		Status    string    `json:"status"`
		Service   string    `json:"service"`
		Timestamp time.Time `json:"timestamp"`
	}
	if err := json.NewDecoder(strings.NewReader(response.Body.String())).Decode(&body); err != nil {
		t.Fatalf("decode health response: %v", err)
	}
	if body.Status != "ok" {
		t.Errorf("status field = %q, want %q", body.Status, "ok")
	}
	if body.Service != "digital-ordering-api" {
		t.Errorf("service field = %q, want %q", body.Service, "digital-ordering-api")
	}
	if body.Timestamp.IsZero() {
		t.Error("timestamp field is zero, want valid timestamp")
	}
}

func TestReadyzRequiredDependency(t *testing.T) {
	router := NewRouterWithReadiness(map[string]ReadinessCheck{
		"postgres": {Required: true, Check: func(context.Context) error { return errors.New("private connection detail") }},
	}, time.Second)
	response := httptest.NewRecorder()
	router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/readyz", nil))
	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", response.Code)
	}
	if strings.Contains(response.Body.String(), "private connection detail") {
		t.Fatal("readiness response leaked dependency error")
	}
	var body struct {
		Status       string                      `json:"status"`
		Dependencies map[string]dependencyStatus `json:"dependencies"`
	}
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body.Status != "not_ready" || body.Dependencies["postgres"].Status != "unavailable" {
		t.Fatalf("unexpected readiness body: %+v", body)
	}
}

func TestReadyzOptionalDependencyDoesNotBlock(t *testing.T) {
	router := NewRouterWithReadiness(map[string]ReadinessCheck{
		"postgres": {Required: true, Check: func(context.Context) error { return nil }},
		"redis":    {Required: false, Check: func(context.Context) error { return errors.New("offline") }},
	}, time.Second)
	response := httptest.NewRecorder()
	router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/readyz", nil))
	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", response.Code)
	}
	var body struct {
		Status       string                      `json:"status"`
		Dependencies map[string]dependencyStatus `json:"dependencies"`
	}
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body.Status != "ready" || body.Dependencies["redis"].Status != "unavailable" {
		t.Fatalf("unexpected readiness body: %+v", body)
	}
}
