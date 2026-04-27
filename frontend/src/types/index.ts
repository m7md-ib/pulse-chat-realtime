export interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
  createdAt?: string;
}

export type MessageStatus = 'sent' | 'delivered' | 'seen';

export interface Message {
  _id: string;
  senderId: User | string;
  receiverId: User | string;
  content: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface TypingState {
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface SendMessagePayload {
  receiverId: string;
  content: string;
}
