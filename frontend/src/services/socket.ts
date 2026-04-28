import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket: Socket | null = null;
let currentToken: string | null = null;

// ─── Get socket (throws if not initialized) ──────────────────────────────────
export const getSocket = (): Socket => {
  if (!socket || !socket.connected) {
    throw new Error("Socket not initialized. Call initSocket() first.");
  }
  return socket;
};

// ─── Initialize socket with token ────────────────────────────────────────────
export const initSocket = (token: string): Socket | null => {
  if (!token) {
    console.warn("[Socket] No token provided — aborting connection.");
    return null;
  }

  // Already connected with the same token — reuse
  if (socket && socket.connected && currentToken === token) {
    return socket;
  }

  // Clean up any existing socket first
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  currentToken = token;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1500,
    reconnectionDelayMax: 10_000,
    timeout: 10_000,
  });

  socket.on("connect", () => {
    console.info("[Socket] Connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.info("[Socket] Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("[Socket] Connection error:", err.message);
  });

  socket.on("reconnect", (attempt) => {
    console.info("[Socket] Reconnected after", attempt, "attempts");
  });

  return socket;
};

// ─── Disconnect and clean up ─────────────────────────────────────────────────
export const disconnectSocket = (): void => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
};

// ─── Check connection status ─────────────────────────────────────────────────
export const isSocketConnected = (): boolean => {
  return !!socket?.connected;
};
