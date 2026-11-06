package notification

import (
	"context"
	"fmt"
	"time"

	pkgws "menuflow/backend/pkg/websocket"
)

type ReadyEvent struct {
	OrderID           string   `json:"order_id"`
	OrderRef          string   `json:"order_ref"`
	RestaurantID      string   `json:"restaurant_id"`
	TableLabel        string   `json:"table_label"`
	EstablishmentMode string   `json:"establishment_mode"` // table_service | self_service
	ItemsSummary      []string `json:"items_summary"`
	Timestamp         time.Time `json:"timestamp"`
}

type Router struct {
	hub *pkgws.Hub
}

func NewRouter(hub *pkgws.Hub) *Router {
	return &Router{hub: hub}
}

// RouteReadyEvent dispatches ready notification per Establishment mode (FR-13 & AD-4)
func (r *Router) RouteReadyEvent(ctx context.Context, event ReadyEvent) error {
	event.Timestamp = time.Now().UTC()

	if event.EstablishmentMode == "self_service" {
		// Route to Guest session topic order:{order_ulid}:status
		topic := fmt.Sprintf("order:%s:status", event.OrderID)
		if r.hub != nil {
			_ = r.hub.Broadcast(topic, "order.ready.self_service", event)
		}
		// Also log event to stream per AD-8
		pkgws.RecordEvent("events:"+topic, "order.ready.self_service", event)
	} else {
		// Route to Waiter topic restaurant:{rid}:waiter per FR-13 & AD-4
		topic := fmt.Sprintf("restaurant:%s:waiter", event.RestaurantID)
		if r.hub != nil {
			_ = r.hub.Broadcast(topic, "order.ready.waiter", event)
		}
		pkgws.RecordEvent("events:"+topic, "order.ready.waiter", event)
	}

	return nil
}
