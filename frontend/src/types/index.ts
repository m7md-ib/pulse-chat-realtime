// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  lastSeen?: string;
}

// ─── Message ─────────────────────────────────────────────────────────────────
export type MessageStatus = "sending" | "sent" | "delivered" | "seen";

export interface Message {
  _id: string;
  senderId: string | User;
  receiverId: string;
  content: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── API Error ────────────────────────────────────────────────────────────────
export interface ApiError {
  message: string;
  status?: number;
}
