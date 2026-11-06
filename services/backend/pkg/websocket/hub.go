package websocket

import (
	"encoding/json"
	"fmt"
	"sync"
)

type EventMessage struct {
	Topic     string      `json:"topic"`
	EventType string      `json:"event_type"`
	Payload   interface{} `json:"payload"`
}

type Hub struct {
	mu     sync.RWMutex
	topics map[string]map[string]chan []byte // topic -> (clientID -> channel)
}

func NewHub() *Hub {
	return &Hub{
		topics: make(map[string]map[string]chan []byte),
	}
}

// Subscribe adds a client channel to a specific topic (e.g. restaurant:{rid}:kds)
func (h *Hub) Subscribe(topic, clientID string, ch chan []byte) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, exists := h.topics[topic]; !exists {
		h.topics[topic] = make(map[string]chan []byte)
	}
	h.topics[topic][clientID] = ch
}

// Unsubscribe removes a client channel from a topic
func (h *Hub) Unsubscribe(topic, clientID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if clients, exists := h.topics[topic]; exists {
		delete(clients, clientID)
		if len(clients) == 0 {
			delete(h.topics, topic)
		}
	}
}

// Broadcast sends an event payload to all clients subscribed to a Redis Pub/Sub topic per AD-4
func (h *Hub) Broadcast(topic, eventType string, payload interface{}) error {
	h.mu.RLock()
	defer h.mu.RUnlock()

	msg := EventMessage{
		Topic:     topic,
		EventType: eventType,
		Payload:   payload,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("websocket: failed to marshal event message: %w", err)
	}

	if clients, exists := h.topics[topic]; exists {
		for _, ch := range clients {
			select {
			case ch <- data:
			default:
				// Non-blocking write if buffer full
			}
		}
	}

	return nil
}
