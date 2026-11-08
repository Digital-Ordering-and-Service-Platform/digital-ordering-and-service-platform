package websocket

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	ws "github.com/coder/websocket"
)

func TestHubWritesConcurrentlyAndShutsDown(t *testing.T) {
	hub, err := NewHub(32)
	if err != nil {
		t.Fatal(err)
	}
	server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := ws.Accept(w, r, nil)
		if err != nil {
			return
		}
		_ = hub.ServeConn(r.Context(), "authorized:session", conn)
	}))
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil { t.Skipf("loopback listener unavailable in this environment: %v",err) }
	server.Listener = listener
	server.Start()
	defer server.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	client, _, err := ws.Dial(ctx, toWS(server.URL), nil)
	if err != nil {
		t.Fatal(err)
	}
	defer client.CloseNow()
	waitForConnections(t, hub, 1)
	const count = 20
	var writers sync.WaitGroup
	for i := 0; i < count; i++ {
		writers.Add(1)
		go func(n int) {
			defer writers.Done()
			if err := hub.Publish("authorized:session", []byte(fmt.Sprintf(`{"sequence":%d}`, n))); err != nil {
				t.Errorf("Publish: %v", err)
			}
		}(i)
	}
	writers.Wait()
	seen := make(map[string]bool, count)
	for i := 0; i < count; i++ {
		_, payload, err := client.Read(ctx)
		if err != nil {
			t.Fatalf("read message %d: %v", i, err)
		}
		seen[string(payload)] = true
	}
	if len(seen) != count {
		t.Fatalf("received %d unique messages, want %d", len(seen), count)
	}
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer shutdownCancel()
	if err := hub.Shutdown(shutdownCtx); err != nil {
		t.Fatal(err)
	}
	if hub.ConnectionCount() != 0 {
		t.Fatalf("connections after shutdown = %d", hub.ConnectionCount())
	}
}

func waitForConnections(t *testing.T, hub *Hub, want int) {
	t.Helper()
	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		if hub.ConnectionCount() == want {
			return
		}
		time.Sleep(time.Millisecond)
	}
	t.Fatalf("connection count = %d, want %d", hub.ConnectionCount(), want)
}
func toWS(url string) string { return "ws" + url[len("http"):] }
