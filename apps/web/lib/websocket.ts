"use client";

type MessageHandler = (data: any) => void;

export class MenuFlowWebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private onMessageCallback: MessageHandler | null = null;
  private isExplicitlyClosed = false;

  constructor(topic: string) {
    let wsHost = "localhost:8080";
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname || "localhost";
      // If running on local dev machine, connect to backend port 8080
      wsHost = `${hostname}:8080`;
    }
    const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
    this.url = `${protocol}//${wsHost}/ws?topic=${encodeURIComponent(topic)}`;
  }

  public connect(onMessage: MessageHandler) {
    this.onMessageCallback = onMessage;
    this.isExplicitlyClosed = false;
    if (typeof window === "undefined") return;

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        // Connected
      };

      this.socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (this.onMessageCallback) {
            this.onMessageCallback(parsed);
          }
        } catch (err) {
          console.warn("websocket: failed to parse incoming WS message", err);
        }
      };

      this.socket.onerror = (err) => {
        // Socket error handled silently, reconnection kicks in on close
      };

      this.socket.onclose = () => {
        if (!this.isExplicitlyClosed) {
          // Auto-reconnect on unexpected disconnect
          setTimeout(() => {
            if (!this.isExplicitlyClosed) {
              this.connect(onMessage);
            }
          }, 3000);
        }
      };
    } catch (err) {
      console.warn("websocket: connection error", err);
    }
  }

  public send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const KDSWebSocketClient = MenuFlowWebSocketClient;
