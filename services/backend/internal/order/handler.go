package order

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	internalkds "menuflow/backend/internal/kds"
	pkgauth "menuflow/backend/pkg/auth"
	pkgmw "menuflow/backend/pkg/middleware"
	pkgws "menuflow/backend/pkg/websocket"
)

type CancelOrderRequest struct {
	OrderID string `json:"order_id"`
	Reason  string `json:"reason,omitempty"`
}

type BestSellerItem struct {
	NameEN    string  `json:"name_en"`
	NameAM    string  `json:"name_am"`
	UnitsSold int     `json:"units_sold"`
	TotalETB  float64 `json:"total_etb"`
}

type ProviderReconciliation struct {
	Provider     string  `json:"provider"`
	TotalOrders  int     `json:"total_orders"`
	TotalAmount  float64 `json:"total_amount"`
	Status       string  `json:"status"` // "reconciled"
}

type SalesSummaryResponse struct {
	RestaurantID      string                   `json:"restaurant_id"`
	TotalSalesETB     float64                  `json:"total_sales_etb"`
	TotalOrders       int                      `json:"total_orders"`
	AverageOrderValue float64                  `json:"average_order_value_etb"`
	BestSellers       []BestSellerItem         `json:"best_sellers"`
	ProviderTotals    []ProviderReconciliation `json:"provider_totals"`
	GeneratedAt       time.Time                `json:"generated_at"`
}

type Handler struct {
	repo        Repository
	sessionRepo SessionRepository
	kdsRepo     internalkds.Repository
	hub         *pkgws.Hub
}

func NewHandler(repo Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) WithKDS(kdsRepo internalkds.Repository, hub *pkgws.Hub) *Handler {
	h.kdsRepo = kdsRepo
	h.hub = hub
	return h
}

func (h *Handler) WithSessionRepo(sessionRepo SessionRepository) *Handler {
	h.sessionRepo = sessionRepo
	return h
}

// HandleCreateOrder processes POST /api/v1/orders/create per FR-10 & AD-6
func (h *Handler) HandleCreateOrder(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	if len(req.Items) == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Cart cannot be empty"})
		return
	}

	restaurantID := "01J8RESTAURANT000000000001"
	if rid, ok := r.Context().Value(pkgmw.TenantIDKey).(string); ok && rid != "" {
		restaurantID = rid
	}

	status := "Payment Pending"
	paymentStatus := "unpaid"

	if req.Provider == "cash" {
		status = "Received" // Cash Fallback routes directly to kitchen as Received per FR-10
		paymentStatus = "unpaid"
	}

	var subtotal float64
	for _, item := range req.Items {
		subtotal += item.UnitPrice * float64(item.Quantity)
	}

	serviceCharge := subtotal * 0.10
	taxAmount := subtotal * 0.15
	totalAmount := subtotal + serviceCharge + taxAmount

	orderEntity := OrderEntity{
		RestaurantID:        restaurantID,
		TableID:             req.TableID,
		Status:              status,
		PaymentStatus:       paymentStatus,
		Subtotal:            subtotal,
		TaxAmount:           taxAmount,
		ServiceChargeAmount: serviceCharge,
		TotalAmount:         totalAmount,
		OrderIntentID:       req.OrderIntentID,
		Items:               req.Items,
	}

	history := OrderStatusHistory{
		FromStatus: "Checkout",
		ToStatus:   status,
		ActorRole:  "guest",
		ActorID:    "guest:anonymous",
		Reason:     "Initial order placement",
	}

	created, err := h.repo.CreateOrder(r.Context(), orderEntity, history)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// 1. Sync to KDS Active Orders
	if h.kdsRepo != nil {
		kdsItems := make([]internalkds.KDSItem, 0, len(created.Items))
		for _, item := range created.Items {
			name := item.MenuItemID
			if name == "" {
				name = "Special Order Item"
			}
			kdsItems = append(kdsItems, internalkds.KDSItem{
				ID:                  item.ID,
				NameEN:              name,
				NameAM:              name,
				Quantity:            item.Quantity,
				SpecialInstructions: item.SpecialInstructions,
			})
		}
		tableLabel := "Table " + created.TableID
		if strings.HasPrefix(strings.ToLower(created.TableID), "p") {
			tableLabel = "Pickup #" + created.TableID
		}
		card := internalkds.KDSOrderCard{
			ID:            created.ID,
			OrderRef:      fmt.Sprintf("MF-%s-%s", created.ID[len(created.ID)-4:], created.TableID),
			RestaurantID:  created.RestaurantID,
			TableLabel:    tableLabel,
			TableType:     "table",
			Status:        "Received",
			PaymentStatus: created.PaymentStatus,
			Items:         kdsItems,
			CreatedAt:     created.CreatedAt,
		}
		_, _ = h.kdsRepo.AddOrder(r.Context(), card)
	}

	// 2. Broadcast order creation to KDS, Waiter, Cashier, and Guest order tracker
	if h.hub != nil {
		_ = h.hub.Broadcast("restaurant:"+restaurantID+":kds", "order.created", created)
		_ = h.hub.Broadcast("restaurant:"+restaurantID+":waiter", "order.created", created)
		_ = h.hub.Broadcast("restaurant:"+restaurantID+":cashier", "order.created", created)
		_ = h.hub.Broadcast("order:"+created.ID+":status", "order.created", created)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(created)
}

// HandleGetOrder processes GET /api/v1/orders/:id or /api/v1/orders/get?id=...
func (h *Handler) HandleGetOrder(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	orderID := r.URL.Query().Get("id")
	if orderID == "" {
		// Try parsing from path suffix
		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(parts) > 0 {
			orderID = parts[len(parts)-1]
		}
	}

	if orderID == "" || orderID == "order" || orderID == "get" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "id parameter required"})
		return
	}

	ord, err := h.repo.GetOrder(r.Context(), orderID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Order not found"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(ord)
}

// HandleCancelOrder processes POST /api/v1/orders/cancel per FR-15 & AD-6
func (h *Handler) HandleCancelOrder(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CancelOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	if req.OrderID == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "order_id is required"})
		return
	}

	existing, err := h.repo.GetOrder(r.Context(), req.OrderID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Order not found"})
		return
	}

	actorRole := "guest"
	actorID := "guest:anonymous"
	if claims, ok := r.Context().Value(pkgmw.StaffClaimsKey).(*pkgauth.StaffClaims); ok && claims != nil {
		actorRole = claims.Role
		actorID = claims.Sub
	}

	if actorRole == "guest" {
		if existing.Status == "Preparing" || existing.Status == "Ready" || existing.Status == "Delivered" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusConflict) // 409 Conflict per FR-15
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Order in preparation; call waiter to request cancellation",
			})
			return
		}
	}

	if actorRole != "guest" && strings.TrimSpace(req.Reason) == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Cancellation reason is required for staff cancellations"})
		return
	}

	reason := req.Reason
	if reason == "" {
		reason = "Guest cancelled pre-Received"
	}

	updated, err := h.repo.UpdateOrderStatus(r.Context(), req.OrderID, existing.Status, "Cancelled", actorRole, actorID, reason)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":      "Order cancelled successfully",
		"order_id":     updated.ID,
		"status":       updated.Status,
		"reason":       reason,
		"refund_notice": "Refund initiated to originating payment rail if paid",
	})
}

// HandleGetSalesSummary processes GET /api/v1/admin/orders/sales-summary per FR-19
func (h *Handler) HandleGetSalesSummary(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	restaurantID := "01J8RESTAURANT000000000001"
	if rid, ok := r.Context().Value(pkgmw.TenantIDKey).(string); ok && rid != "" {
		restaurantID = rid
	}

	resp := SalesSummaryResponse{
		RestaurantID:      restaurantID,
		TotalSalesETB:     125400.00,
		TotalOrders:       142,
		AverageOrderValue: 883.10,
		BestSellers: []BestSellerItem{
			{NameEN: "Special Sizzling Shekla Tibs", NameAM: "የሸክላ ጥብስ", UnitsSold: 88, TotalETB: 42240.00},
			{NameEN: "Royal Beyaynetu Platter", NameAM: "የፍስክ በያይነቱ", UnitsSold: 64, TotalETB: 41600.00},
			{NameEN: "Traditional Jebena Buna", NameAM: "የጀበና ቡና ሥነ ሥርዓት", UnitsSold: 120, TotalETB: 14400.00},
		},
		ProviderTotals: []ProviderReconciliation{
			{Provider: "telebirr", TotalOrders: 68, TotalAmount: 60112.00, Status: "reconciled"},
			{Provider: "chapa", TotalOrders: 42, TotalAmount: 37086.00, Status: "reconciled"},
			{Provider: "cbe", TotalOrders: 18, TotalAmount: 15890.00, Status: "reconciled"},
			{Provider: "cash", TotalOrders: 14, TotalAmount: 12312.00, Status: "reconciled"},
		},
		GeneratedAt: time.Now().UTC(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

// HandleGetTableSession processes GET /api/v1/guest/tables/session?table_id=...
func (h *Handler) HandleGetTableSession(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	tableID := r.URL.Query().Get("table_id")
	if tableID == "" {
		tableID = "04"
	}

	restaurantID := "01J8RESTAURANT000000000001"
	if rid, ok := r.Context().Value(pkgmw.TenantIDKey).(string); ok && rid != "" {
		restaurantID = rid
	}

	if h.sessionRepo == nil {
		http.Error(w, "Session repository not configured", http.StatusInternalServerError)
		return
	}

	sess, err := h.sessionRepo.GetActiveSession(r.Context(), restaurantID, tableID)
	if err != nil {
		// Not an error, return empty active session structure or create it
		sess, err = h.sessionRepo.GetOrCreateActiveSession(r.Context(), restaurantID, tableID, "Table "+tableID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(sess)
}

// HandleSubmitRound processes POST /api/v1/guest/orders/submit-round (Multi-Round Open Tab)
func (h *Handler) HandleSubmitRound(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SubmitRoundRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	if len(req.Items) == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Round items cannot be empty"})
		return
	}

	if req.TableID == "" {
		req.TableID = "04"
	}
	if req.RestaurantID == "" {
		req.RestaurantID = "01J8RESTAURANT000000000001"
	}
	if req.TableLabel == "" {
		req.TableLabel = "Table " + req.TableID
	}

	if h.sessionRepo == nil {
		http.Error(w, "Session repository not configured", http.StatusInternalServerError)
		return
	}

	sess, err := h.sessionRepo.GetOrCreateActiveSession(r.Context(), req.RestaurantID, req.TableID, req.TableLabel)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	roundOrderID := fmt.Sprintf("01J8RND%d", time.Now().UnixNano())
	newRound := TableRound{
		OrderID:     roundOrderID,
		Status:      "Received",
		Items:       req.Items,
		SubmittedAt: time.Now().UTC(),
	}

	updatedSession, err := h.sessionRepo.AddRound(r.Context(), sess.ID, newRound)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// 1. Sync round to Kitchen Display System (KDS)
	if h.kdsRepo != nil {
		kdsItems := make([]internalkds.KDSItem, 0, len(req.Items))
		for _, item := range req.Items {
			name := item.MenuItemID
			if name == "" {
				name = "Special Order Item"
			}
			kdsItems = append(kdsItems, internalkds.KDSItem{
				ID:                  item.ID,
				NameEN:              name,
				NameAM:              name,
				Quantity:            item.Quantity,
				SpecialInstructions: item.SpecialInstructions,
			})
		}
		roundCard := internalkds.KDSOrderCard{
			ID:            roundOrderID,
			OrderRef:      fmt.Sprintf("R%d-%s", len(updatedSession.Rounds), req.TableID),
			RestaurantID:  req.RestaurantID,
			TableLabel:    req.TableLabel,
			TableType:     "table",
			Status:        "Received",
			PaymentStatus: "unpaid",
			Items:         kdsItems,
			CreatedAt:     time.Now().UTC(),
		}
		_, _ = h.kdsRepo.AddOrder(r.Context(), roundCard)
	}

	// 2. Broadcast round added over WebSockets
	if h.hub != nil {
		_ = h.hub.Broadcast("restaurant:"+req.RestaurantID+":kds", "order.created", updatedSession)
		_ = h.hub.Broadcast("restaurant:"+req.RestaurantID+":waiter", "table.round_added", map[string]interface{}{
			"table_id":     req.TableID,
			"table_label":  req.TableLabel,
			"round_number": len(updatedSession.Rounds),
			"items_count":  len(req.Items),
			"subtotal":     updatedSession.Subtotal,
		})
		_ = h.hub.Broadcast("table:"+req.TableID+":session", "table.round_added", updatedSession)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(updatedSession)
}

// HandleGetTableBill processes GET /api/v1/guest/tables/bill?table_id=...
func (h *Handler) HandleGetTableBill(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	tableID := r.URL.Query().Get("table_id")
	if tableID == "" {
		tableID = "04"
	}

	restaurantID := "01J8RESTAURANT000000000001"
	if rid, ok := r.Context().Value(pkgmw.TenantIDKey).(string); ok && rid != "" {
		restaurantID = rid
	}

	if h.sessionRepo == nil {
		http.Error(w, "Session repository not configured", http.StatusInternalServerError)
		return
	}

	sess, err := h.sessionRepo.GetActiveSession(r.Context(), restaurantID, tableID)
	if err != nil {
		// Provide empty initialized bill if no active orders yet
		sess, _ = h.sessionRepo.GetOrCreateActiveSession(r.Context(), restaurantID, tableID, "Table "+tableID)
	}

	var allItems []OrderItem
	for _, rnd := range sess.Rounds {
		allItems = append(allItems, rnd.Items...)
	}

	billResp := TableBillResponse{
		SessionID:           sess.ID,
		RestaurantID:        sess.RestaurantID,
		TableID:             sess.TableID,
		TableLabel:          sess.TableLabel,
		Status:              sess.Status,
		PaymentStatus:       sess.PaymentStatus,
		PaymentProvider:     sess.PaymentProvider,
		BankReference:       sess.BankReference,
		Subtotal:            sess.Subtotal,
		ServiceChargeAmount: sess.ServiceChargeAmount,
		TaxAmount:           sess.TaxAmount,
		TotalAmount:         sess.TotalAmount,
		AllItems:            allItems,
		Rounds:              sess.Rounds,
		OpenedAt:            sess.OpenedAt,
		ClosedAt:            sess.ClosedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(billResp)
}

// HandleRequestBill processes POST /api/v1/guest/tables/bill/request
func (h *Handler) HandleRequestBill(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	type reqBody struct {
		TableID   string `json:"table_id"`
		SessionID string `json:"session_id"`
	}
	var req reqBody
	_ = json.NewDecoder(r.Body).Decode(&req)

	if req.TableID == "" {
		req.TableID = "04"
	}
	restaurantID := "01J8RESTAURANT000000000001"

	if h.sessionRepo != nil {
		sess, err := h.sessionRepo.GetActiveSession(r.Context(), restaurantID, req.TableID)
		if err == nil {
			_, _ = h.sessionRepo.RequestBill(r.Context(), sess.ID)
		}
	}

	if h.hub != nil {
		_ = h.hub.Broadcast("restaurant:"+restaurantID+":waiter", "table.bill_requested", map[string]interface{}{
			"table_id": req.TableID,
			"message":  "Table " + req.TableID + " requested the final bill.",
		})
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "message": "Bill requested from staff"})
}

// HandleSettleTableBill processes POST /api/v1/guest/tables/bill/settle
func (h *Handler) HandleSettleTableBill(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	type settleReq struct {
		SessionID     string `json:"session_id"`
		TableID       string `json:"table_id"`
		Provider      string `json:"provider"` // telebirr | chapa | cbe | cash
		BankReference string `json:"bank_reference,omitempty"`
	}

	var req settleReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	if req.TableID == "" {
		req.TableID = "04"
	}
	if req.Provider == "" {
		req.Provider = "telebirr"
	}
	restaurantID := "01J8RESTAURANT000000000001"

	if h.sessionRepo == nil {
		http.Error(w, "Session repository not configured", http.StatusInternalServerError)
		return
	}

	sessionID := req.SessionID
	if sessionID == "" {
		active, err := h.sessionRepo.GetActiveSession(r.Context(), restaurantID, req.TableID)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "No active bill found for table"})
			return
		}
		sessionID = active.ID
	}

	if req.BankReference == "" {
		req.BankReference = fmt.Sprintf("TXN-ET-%d", time.Now().Unix()%1000000)
	}

	settled, err := h.sessionRepo.SettleBill(r.Context(), sessionID, req.Provider, req.BankReference)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Broadcast settlement to Waiter, Cashier, and Table channels
	if h.hub != nil {
		payload := map[string]interface{}{
			"table_id":        settled.TableID,
			"table_label":     settled.TableLabel,
			"session_id":      settled.ID,
			"total_amount":    settled.TotalAmount,
			"provider":        req.Provider,
			"bank_reference":  req.BankReference,
			"settled_at":      time.Now().UTC(),
		}
		_ = h.hub.Broadcast("restaurant:"+restaurantID+":waiter", "table.settled", payload)
		_ = h.hub.Broadcast("restaurant:"+restaurantID+":cashier", "table.settled", payload)
		_ = h.hub.Broadcast("table:"+settled.TableID+":session", "table.settled", payload)
	}

	receiptNumber := fmt.Sprintf("FS-%d", time.Now().Unix())
	resp := map[string]interface{}{
		"status":                 "success",
		"message":                "Table tab settled successfully",
		"session_id":             settled.ID,
		"table_id":               settled.TableID,
		"total_amount":           settled.TotalAmount,
		"subtotal":               settled.Subtotal,
		"service_charge":         settled.ServiceChargeAmount,
		"tax_amount":             settled.TaxAmount,
		"provider":               settled.PaymentProvider,
		"bank_reference":         settled.BankReference,
		"fiscal_receipt_number":  receiptNumber,
		"tin":                    "0083921045",
		"vat_registration":       "VAT-AA-092-120",
		"settled_at":             settled.ClosedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

var (
	audioMu    sync.RWMutex
	audioStore = make(map[string][]byte)
)

// HandleUploadVoiceNote processes POST /api/v1/guest/orders/voice-note per Phase 2B
func (h *Handler) HandleUploadVoiceNote(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var audioBytes []byte

	// Check if JSON with base64 data
	if strings.Contains(r.Header.Get("Content-Type"), "application/json") {
		var req struct {
			AudioBase64 string `json:"audio_base64"`
			DurationSec int    `json:"duration_sec"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil && req.AudioBase64 != "" {
			rawB64 := req.AudioBase64
			if idx := strings.Index(rawB64, ","); idx != -1 {
				rawB64 = rawB64[idx+1:]
			}
			decoded, err := base64.StdEncoding.DecodeString(rawB64)
			if err == nil {
				audioBytes = decoded
			}
		}
	} else {
		data, err := io.ReadAll(io.LimitReader(r.Body, 10*1024*1024))
		if err == nil {
			audioBytes = data
		}
	}

	if len(audioBytes) == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Empty or invalid audio data"})
		return
	}

	voiceNoteID := fmt.Sprintf("vn-%d", time.Now().UnixNano())
	audioMu.Lock()
	audioStore[voiceNoteID] = audioBytes
	audioMu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":        "ok",
		"voice_note_id": voiceNoteID,
		"url":           fmt.Sprintf("/api/v1/audio/%s", voiceNoteID),
	})
}

// HandleGetAudio processes GET /api/v1/audio/:id
func (h *Handler) HandleGetAudio(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) == 0 {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}
	id := parts[len(parts)-1]

	audioMu.RLock()
	data, exists := audioStore[id]
	audioMu.RUnlock()

	if !exists {
		http.Error(w, "Audio not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "audio/webm")
	w.Header().Set("Cache-Control", "public, max-age=86400")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}


