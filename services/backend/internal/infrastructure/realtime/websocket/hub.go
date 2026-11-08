// Package websocket provides a bounded, topic-scoped transport hub. The caller
// must authenticate and authorize a connection before assigning its topic; this
// package deliberately does not expose an HTTP route or business subscription.
package websocket

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	ws "github.com/coder/websocket"
	"github.com/google/uuid"
)

type Hub struct {
	mu        sync.RWMutex
	clients   map[string]map[string]*peer
	queueSize int
	closed    bool
	workers   sync.WaitGroup
}

type peer struct {
	id     string
	topic  string
	conn   *ws.Conn
	queue  chan []byte
	cancel context.CancelFunc
}

func NewHub(queueSize int) (*Hub, error) {
	if queueSize < 1 {
		return nil, errors.New("WebSocket queue size must be positive")
	}
	return &Hub{clients: make(map[string]map[string]*peer), queueSize: queueSize}, nil
}

// ServeConn registers a connection for a topic selected by an already
// authorized caller, then runs one reader and one writer until disconnect.
func (h *Hub) ServeConn(ctx context.Context, topic string, conn *ws.Conn) error {
	if topic == "" || conn == nil {
		return errors.New("WebSocket topic and connection are required")
	}
	clientCtx, cancel := context.WithCancel(ctx)
	c := &peer{id: uuid.NewString(), topic: topic, conn: conn, queue: make(chan []byte, h.queueSize), cancel: cancel}
	h.mu.Lock()
	if h.closed {
		h.mu.Unlock()
		cancel()
		_ = conn.Close(ws.StatusGoingAway, "server shutting down")
		return errors.New("WebSocket hub is closed")
	}
	if h.clients[topic] == nil {
		h.clients[topic] = make(map[string]*peer)
	}
	h.clients[topic][c.id] = c
	h.workers.Add(1)
	h.mu.Unlock()
	writeDone, readDone := make(chan error, 1), make(chan error, 1)
	go func() { writeDone <- h.writeLoop(clientCtx, c) }()
	go func() {
		for {
			if _, _, err := conn.Read(clientCtx); err != nil {
				readDone <- err
				return
			}
		}
	}()
	var result error
	readStopped, writeStopped := false, false
	select {
	case result = <-readDone:
		readStopped = true
	case result = <-writeDone:
		writeStopped = true
	case <-clientCtx.Done():
		result = clientCtx.Err()
	}
	cancel()
	_ = conn.CloseNow()
	// Join both connection loops so shutdown cannot leave goroutines behind.
	if !readStopped {
		<-readDone
	}
	if !writeStopped {
		<-writeDone
	}
	h.remove(c)
	h.workers.Done()
	return result
}

func (h *Hub) writeLoop(ctx context.Context, c *peer) error {
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case payload := <-c.queue:
			writeCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
			err := c.conn.Write(writeCtx, ws.MessageText, payload)
			cancel()
			if err != nil {
				return err
			}
		}
	}
}

// Publish sends an immutable JSON payload to connections registered under an
// authorized topic. A client that cannot keep up is disconnected instead of
// accumulating an unbounded queue or silently missing ordered updates.
func (h *Hub) Publish(topic string, payload []byte) error {
	if topic == "" || !json.Valid(payload) {
		return errors.New("WebSocket topic and valid JSON payload are required")
	}
	h.mu.RLock()
	clients := make([]*peer, 0, len(h.clients[topic]))
	for _, c := range h.clients[topic] {
		clients = append(clients, c)
	}
	h.mu.RUnlock()
	var dropped int
	for _, c := range clients {
		message := append([]byte(nil), payload...)
		select {
		case c.queue <- message:
		default:
			c.cancel()
			_ = c.conn.CloseNow()
			dropped++
		}
	}
	if dropped > 0 {
		return fmt.Errorf("disconnected %d slow WebSocket client(s)", dropped)
	}
	return nil
}

func (h *Hub) remove(c *peer) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if members := h.clients[c.topic]; members != nil {
		delete(members, c.id)
		if len(members) == 0 {
			delete(h.clients, c.topic)
		}
	}
}

func (h *Hub) Shutdown(ctx context.Context) error {
	h.mu.Lock()
	h.closed = true
	var clients []*peer
	for _, members := range h.clients {
		for _, c := range members {
			clients = append(clients, c)
			c.cancel()
		}
	}
	h.mu.Unlock()
	for _, c := range clients {
		_ = c.conn.CloseNow()
	}
	done := make(chan struct{})
	go func() { h.workers.Wait(); close(done) }()
	select {
	case <-done:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (h *Hub) ConnectionCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	count := 0
	for _, members := range h.clients {
		count += len(members)
	}
	return count
}
