package websocket_test

import (
	"testing"

	pkgws "menuflow/backend/pkg/websocket"
)

func TestEventStreamLoggingAndReplay(t *testing.T) {
	topic := "events:restaurant:01J8REST100"

	// 1. Record event
	streamID1 := pkgws.RecordEvent(topic, "kds.order.created", map[string]string{"order_id": "01J8ORD1"})
	if streamID1 == "" {
		t.Fatalf("expected valid stream ID, got empty")
	}

	streamID2 := pkgws.RecordEvent(topic, "kds.order.status_updated", map[string]string{"order_id": "01J8ORD1", "status": "Preparing"})

	// 2. Replay events since streamID1
	missed, ok := pkgws.GetEventsSince(topic, streamID1)
	if !ok {
		t.Fatalf("expected valid stream replay, got expired signal")
	}

	if len(missed) != 1 || missed[0].ID != streamID2 {
		t.Errorf("expected 1 missed event matching streamID2, got %d events", len(missed))
	}

	// 3. Replay with invalid/expired streamID -> expect full snapshot fallback (false)
	_, okExpired := pkgws.GetEventsSince(topic, "99999999999-0")
	if okExpired {
		t.Errorf("expected expired signal (false) for non-existent streamID, got true")
	}
}
