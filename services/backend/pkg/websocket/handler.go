package websocket

import (
	"crypto/sha1"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

const wsGUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

type ClientMessage struct {
	Action string `json:"action"` // "subscribe", "ping"
	Topic  string `json:"topic"`
}

// ServeWS upgrades the HTTP connection to a native RFC 6455 WebSocket connection and binds to Hub.
func ServeWS(hub *Hub, w http.ResponseWriter, r *http.Request) {
	// 1. Verify WebSocket upgrade headers
	if !strings.EqualFold(r.Header.Get("Upgrade"), "websocket") ||
		!strings.Contains(strings.ToLower(r.Header.Get("Connection")), "upgrade") {
		http.Error(w, "Expected WebSocket Upgrade", http.StatusBadRequest)
		return
	}

	key := r.Header.Get("Sec-WebSocket-Key")
	if key == "" {
		http.Error(w, "Missing Sec-WebSocket-Key", http.StatusBadRequest)
		return
	}

	// 2. Compute Accept Key
	h := sha1.New()
	h.Write([]byte(key + wsGUID))
	acceptKey := base64.StdEncoding.EncodeToString(h.Sum(nil))

	// 3. Hijack connection
	hijacker, ok := w.(http.Hijacker)
	if !ok {
		http.Error(w, "WebSocket Hijack not supported", http.StatusInternalServerError)
		return
	}

	conn, bufrw, err := hijacker.Hijack()
	if err != nil {
		http.Error(w, fmt.Sprintf("WebSocket hijack failed: %v", err), http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	// 4. Send 101 Switching Protocols handshake
	response := "HTTP/1.1 101 Switching Protocols\r\n" +
		"Upgrade: websocket\r\n" +
		"Connection: Upgrade\r\n" +
		"Sec-WebSocket-Accept: " + acceptKey + "\r\n\r\n"
	if _, err := bufrw.WriteString(response); err != nil {
		return
	}
	if err := bufrw.Flush(); err != nil {
		return
	}

	clientID := fmt.Sprintf("client-%d", time.Now().UnixNano())
	sendChan := make(chan []byte, 64)

	// Subscriptions list for cleanup on close
	var subMu sync.Mutex
	subscribedTopics := make(map[string]bool)

	// If topic was provided in query string, auto-subscribe
	initialTopic := r.URL.Query().Get("topic")
	if initialTopic != "" {
		hub.Subscribe(initialTopic, clientID, sendChan)
		subscribedTopics[initialTopic] = true
	}

	defer func() {
		subMu.Lock()
		for t := range subscribedTopics {
			hub.Unsubscribe(t, clientID)
		}
		subMu.Unlock()
	}()

	closeChan := make(chan struct{})

	// Writer Goroutine: sends frames from sendChan to client
	go func() {
		for {
			select {
			case <-closeChan:
				return
			case msg, ok := <-sendChan:
				if !ok {
					return
				}
				if err := writeFrame(conn, 0x01, msg); err != nil {
					return
				}
			}
		}
	}()

	// Reader Loop: reads incoming client frames
	reader := bufrw.Reader
	for {
		header, err := reader.ReadByte()
		if err != nil {
			break
		}

		fin := (header & 0x80) != 0
		_ = fin
		opcode := header & 0x0F

		// Read payload length & mask bit
		lenByte, err := reader.ReadByte()
		if err != nil {
			break
		}

		isMasked := (lenByte & 0x80) != 0
		payloadLen := uint64(lenByte & 0x7F)

		if payloadLen == 126 {
			var extLen uint16
			if err := binary.Read(reader, binary.BigEndian, &extLen); err != nil {
				break
			}
			payloadLen = uint64(extLen)
		} else if payloadLen == 127 {
			var extLen uint64
			if err := binary.Read(reader, binary.BigEndian, &extLen); err != nil {
				break
			}
			payloadLen = extLen
		}

		var mask [4]byte
		if isMasked {
			if _, err := io.ReadFull(reader, mask[:]); err != nil {
				break
			}
		}

		payload := make([]byte, payloadLen)
		if _, err := io.ReadFull(reader, payload); err != nil {
			break
		}

		if isMasked {
			for i := uint64(0); i < payloadLen; i++ {
				payload[i] ^= mask[i%4]
			}
		}

		switch opcode {
		case 0x08: // Close
			_ = writeFrame(conn, 0x08, []byte{})
			close(closeChan)
			return
		case 0x09: // Ping -> reply Pong
			_ = writeFrame(conn, 0x0A, payload)
		case 0x01: // Text Message (JSON action)
			var cMsg ClientMessage
			if err := json.Unmarshal(payload, &cMsg); err == nil {
				if cMsg.Action == "subscribe" && cMsg.Topic != "" {
					subMu.Lock()
					if !subscribedTopics[cMsg.Topic] {
						hub.Subscribe(cMsg.Topic, clientID, sendChan)
						subscribedTopics[cMsg.Topic] = true
					}
					subMu.Unlock()
				}
			}
		}
	}

	close(closeChan)
}

func writeFrame(conn net.Conn, opcode byte, payload []byte) error {
	var header []byte
	length := len(payload)

	firstByte := byte(0x80) | (opcode & 0x0F) // FIN bit set

	if length < 126 {
		header = []byte{firstByte, byte(length)}
	} else if length < 65536 {
		header = []byte{firstByte, 126, byte(length >> 8), byte(length & 0xFF)}
	} else {
		header = make([]byte, 10)
		header[0] = firstByte
		header[1] = 127
		binary.BigEndian.PutUint64(header[2:], uint64(length))
	}

	if _, err := conn.Write(header); err != nil {
		return err
	}
	if length > 0 {
		if _, err := conn.Write(payload); err != nil {
			return err
		}
	}
	return nil
}
