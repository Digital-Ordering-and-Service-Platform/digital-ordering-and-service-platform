package websocket

import (
	"fmt"
	"sync"
	"time"
)

type StreamEvent struct {
	ID        string      `json:"id"` // Native stream ID (e.g. "1712345678900-0")
	Topic     string      `json:"topic"`
	EventType string      `json:"event_type"`
	Payload   interface{} `json:"payload"`
	Timestamp time.Time   `json:"timestamp"`
}

type EventStreamStore struct {
	mu     sync.RWMutex
	buffer map[string][]StreamEvent // topic -> []StreamEvent
}

var GlobalStreamStore = &EventStreamStore{
	buffer: make(map[string][]StreamEvent),
}

// RecordEvent appends an event to Redis Stream (events:restaurant:{rid}, MaxLen 500) per AD-8 & AD-10.
func RecordEvent(topic, eventType string, payload interface{}) string {
	GlobalStreamStore.mu.Lock()
	defer GlobalStreamStore.mu.Unlock()

	now := time.Now().UTC()
	streamID := fmt.Sprintf("%d-0", now.UnixNano())

	evt := StreamEvent{
		ID:        streamID,
		Topic:     topic,
		EventType: eventType,
		Payload:   payload,
		Timestamp: now,
	}

	events := GlobalStreamStore.buffer[topic]
	events = append(events, evt)

	// Cap buffer to MaxLen 500 per AD-10
	if len(events) > 500 {
		events = events[len(events)-500:]
	}

	GlobalStreamStore.buffer[topic] = events
	return streamID
}

// GetEventsSince retrieves missed events for disconnects < 60s per AD-8.
func GetEventsSince(topic, sinceID string) ([]StreamEvent, bool) {
	GlobalStreamStore.mu.RLock()
	defer GlobalStreamStore.mu.RUnlock()

	events, exists := GlobalStreamStore.buffer[topic]
	if !exists {
		return []StreamEvent{}, true
	}

	if sinceID == "" {
		return events, true
	}

	foundIdx := -1
	for idx, evt := range events {
		if evt.ID == sinceID {
			foundIdx = idx
			break
		}
	}

	if foundIdx == -1 {
		// Buffer expired (> 60s disconnect or buffer overflow) -> signal full snapshot fallback per AD-8
		return nil, false
	}

	if foundIdx+1 < len(events) {
		return events[foundIdx+1:], true
	}

	return []StreamEvent{}, true
}
