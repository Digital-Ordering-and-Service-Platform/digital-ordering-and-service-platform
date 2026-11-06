package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"menuflow/backend/internal/kds"
	"menuflow/backend/internal/menu"
	"menuflow/backend/internal/notification"
	"menuflow/backend/internal/order"
	"menuflow/backend/internal/tenant"
	pkgws "menuflow/backend/pkg/websocket"
)

type HealthResponse struct {
	Status    string    `json:"status"`
	Service   string    `json:"service"`
	Timestamp time.Time `json:"timestamp"`
}

// corsMiddleware adds headers for cross-origin local Next.js frontend calls
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Extensions")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	mux := http.NewServeMux()

	// 1. Initialize real-time WebSocket Hub
	hub := pkgws.NewHub()

	// 2. Initialize Repositories
	menuRepo := menu.NewMemoryRepository()
	menuCache := menu.NewCache()
	menuHandler := menu.NewHandler(menuRepo, menuCache)

	kdsRepo := kds.NewMemoryRepository()
	kdsHandler := kds.NewHandler(kdsRepo, hub)

	orderRepo := order.NewMemoryRepository()
	sessionRepo := order.NewMemorySessionRepository()
	orderHandler := order.NewHandler(orderRepo).WithKDS(kdsRepo, hub).WithSessionRepo(sessionRepo)

	tenantRepo := tenant.NewMemoryRepository()
	tenantSecret := "menuflow_dev_secret_key_32bytes!"
	tenantHandler := tenant.NewHandler(tenantRepo, tenantSecret)

	notifRouter := notification.NewRouter(hub)
	serviceRepo := notification.NewMemoryServiceRequestRepository()
	notifHandler := notification.NewHandler(notifRouter, serviceRepo, hub)

	// Health Check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(HealthResponse{
			Status:    "ok",
			Service:   "MenuFlow Go API with Live WebSockets",
			Timestamp: time.Now().UTC(),
		})
	})

	// WebSocket Endpoint (Native RFC 6455 upgrades)
	handleWS := func(w http.ResponseWriter, r *http.Request) {
		pkgws.ServeWS(hub, w, r)
	}
	mux.HandleFunc("/ws", handleWS)
	mux.HandleFunc("/api/v1/ws", handleWS)
	mux.HandleFunc("/api/v1/ws/staff", handleWS)

	// Order & Sales Analytics Endpoints
	mux.HandleFunc("/api/v1/admin/orders/sales-summary", orderHandler.HandleGetSalesSummary)
	mux.HandleFunc("/api/v1/orders/create", orderHandler.HandleCreateOrder)
	mux.HandleFunc("/api/v1/orders/get", orderHandler.HandleGetOrder)
	mux.HandleFunc("/api/v1/orders/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			orderHandler.HandleGetOrder(w, r)
			return
		}
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	})

	// Multi-Round Table Tabs & Post-Dining Digital Bill Endpoints
	mux.HandleFunc("/api/v1/guest/tables/session", orderHandler.HandleGetTableSession)
	mux.HandleFunc("/api/v1/guest/orders/submit-round", orderHandler.HandleSubmitRound)
	mux.HandleFunc("/api/v1/guest/tables/bill", orderHandler.HandleGetTableBill)
	mux.HandleFunc("/api/v1/guest/tables/bill/request", orderHandler.HandleRequestBill)
	mux.HandleFunc("/api/v1/guest/tables/bill/settle", orderHandler.HandleSettleTableBill)

	// Spoken Voice Notes & Audio Streaming Endpoints per Phase 2B
	mux.HandleFunc("/api/v1/guest/orders/voice-note", orderHandler.HandleUploadVoiceNote)
	mux.HandleFunc("/api/v1/audio/", orderHandler.HandleGetAudio)

	// KDS Live Ticket Pipeline Endpoints
	mux.HandleFunc("/api/v1/kds/orders/active", kdsHandler.HandleGetActiveOrders)
	mux.HandleFunc("/api/v1/kds/orders/status", kdsHandler.HandleUpdateStatus)
	mux.HandleFunc("/api/v1/kds/orders/bump", kdsHandler.HandleUpdateStatus)
	mux.HandleFunc("/api/v1/kds/events", kdsHandler.HandleGetKDSEvents)

	// Waiter Runner & Service Requests Endpoints
	mux.HandleFunc("/api/v1/waiter/deliver", notifHandler.HandleDeliverOrder)
	mux.HandleFunc("/api/v1/guest/service-request", notifHandler.HandleCreateServiceRequest)
	mux.HandleFunc("/api/v1/waiter/service-requests", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPatch || (r.Method == http.MethodPost && strings.Contains(r.URL.Path, "resolve")) {
			notifHandler.HandleUpdateServiceRequest(w, r)
			return
		}
		notifHandler.HandleGetServiceRequests(w, r)
	})

	// Menu & Stock Manager Endpoints
	mux.HandleFunc("/api/v1/guest/menu", menuHandler.HandleGetGuestMenu)
	mux.HandleFunc("/api/v1/admin/menu/prices/bulk", menuHandler.HandleBulkPrices)

	// Tables & Settings Endpoints
	mux.HandleFunc("/api/v1/admin/tables", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			tenantHandler.HandleCreateTable(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"restaurant_id": "01J8RESTAURANT000000000001",
			"active_tables": 11,
			"occupied":      5,
			"bill_pending":  3,
			"available":     3,
		})
	})
	mux.HandleFunc("/api/v1/admin/settings", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPut {
			tenantHandler.HandleUpdateSettings(w, r)
			return
		}
		tenantHandler.HandleGetSettings(w, r)
	})

	handlerWithCORS := corsMiddleware(mux)

	port := ":8080"
	fmt.Printf("MenuFlow Go Backend Monolith starting on %s with WebSocket Hub...\n", port)
	if err := http.ListenAndServe(port, handlerWithCORS); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
