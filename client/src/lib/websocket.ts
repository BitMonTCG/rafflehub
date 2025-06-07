import { SocketMessage } from "@/types";

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private listeners: { [key: string]: ((data: any) => void)[] } = {};
  private isConnecting: boolean = false;
  private isWebSocketEnabled: boolean = false;

  constructor() {
    // Only enable WebSocket in development or when explicitly enabled
    this.isWebSocketEnabled = this.checkWebSocketAvailability();
  }

  private checkWebSocketAvailability(): boolean {
    // Check if we're in development mode using Vite's environment variables
    const isDevelopment = import.meta.env.DEV;
    
    // Check if WebSocket is available (not on serverless)
    const hasWebSocketSupport = typeof WebSocket !== 'undefined';
    
    // Log the decision for debugging
    console.log('WebSocket availability check:', {
      isDevelopment,
      mode: import.meta.env.MODE,
      hasWebSocketSupport,
      hostname: window.location.hostname,
      enabled: isDevelopment && hasWebSocketSupport
    });
    
    return isDevelopment && hasWebSocketSupport;
  }

  connect(): void {
    if (!this.isWebSocketEnabled) {
      console.log('WebSocket disabled for this environment');
      return;
    }
    
    if (this.socket || this.isConnecting) return;
    
    this.isConnecting = true;
    
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Attempting WebSocket connection to:', wsUrl);
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log("WebSocket connected");
        this.isConnecting = false;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        
        // Start heartbeat
        this.heartbeat();
      };
      
      this.socket.onmessage = (event) => {
        try {
          const message: SocketMessage = JSON.parse(event.data);
          console.log("WebSocket message received:", message.type);
          
          if (this.listeners[message.type]) {
            this.listeners[message.type].forEach(callback => callback(message));
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      
      this.socket.onclose = () => {
        console.log("WebSocket disconnected");
        this.socket = null;
        this.isConnecting = false;
        if (this.isWebSocketEnabled) {
          this.scheduleReconnect();
        }
      };
      
      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        // Let onclose handle reconnection
        this.socket?.close();
      };
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      this.isConnecting = false;
      if (this.isWebSocketEnabled) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect(): void {
    if (!this.isWebSocketEnabled || this.reconnectTimer) return;
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }
  
  private heartbeat(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'PING' }));
      
      setTimeout(() => {
        this.heartbeat();
      }, 30000); // Every 30 seconds
    }
  }

  on(type: string, callback: (data: any) => void): () => void {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    
    this.listeners[type].push(callback);
    
    // Return unsubscribe function
    return () => {
      if (this.listeners[type]) {
        this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
      }
    };
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.listeners = {};
  }

  // Add method to check if WebSocket is enabled
  isEnabled(): boolean {
    return this.isWebSocketEnabled;
  }
}

// Export as a singleton
export const webSocketService = new WebSocketService();
