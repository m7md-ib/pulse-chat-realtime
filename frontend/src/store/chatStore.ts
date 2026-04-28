import { create } from "zustand";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { User, Message } from "../types";

// ─── State shape ──────────────────────────────────────────────────────────────
interface ChatState {
  users: User[];
  activeChat: User | null;
  messages: Message[];
  onlineUsers: string[];
  typingUsers: Record<string, boolean>;
  isLoadingUsers: boolean;
  isLoadingMessages: boolean;

  // Actions
  fetchUsers: () => Promise<void>;
  fetchMessages: (userId: string) => Promise<void>;
  sendMessage: (receiverId: string, content: string) => void;
  sendTyping: (receiverId: string, isTyping: boolean) => void;
  setActiveChat: (user: User | null) => void;

  // Socket-driven updates (called from useSocket hook)
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: Message["status"]) => void;
  setOnlineUsers: (userIds: string[]) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  setTyping: (userId: string, isTyping: boolean) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useChatStore = create<ChatState>((set, get) => ({
  users: [],
  activeChat: null,
  messages: [],
  onlineUsers: [],
  typingUsers: {},
  isLoadingUsers: false,
  isLoadingMessages: false,

  // ─── Fetch all users ────────────────────────────────────────────────────
  fetchUsers: async () => {
    set({ isLoadingUsers: true });
    try {
      const { data } = await api.get<User[]>("/users");
      set({ users: data });
    } catch (err) {
      console.error("[Store] fetchUsers error:", err);
    } finally {
      set({ isLoadingUsers: false });
    }
  },

  // ─── Fetch messages for a user ──────────────────────────────────────────
  fetchMessages: async (userId: string) => {
    set({ isLoadingMessages: true, messages: [] });
    try {
      const { data } = await api.get<Message[]>(`/messages/${userId}`);
      set({ messages: data });
    } catch (err) {
      console.error("[Store] fetchMessages error:", err);
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  // ─── Send a message via socket ──────────────────────────────────────────
  sendMessage: (receiverId: string, content: string) => {
    try {
      const socket = getSocket();
      socket.emit("send_message", { receiverId, content });
    } catch (err) {
      console.error("[Store] sendMessage error:", err);
    }
  },

  // ─── Emit typing indicator ──────────────────────────────────────────────
  sendTyping: (receiverId: string, isTyping: boolean) => {
    try {
      const socket = getSocket();
      socket.emit("typing", { receiverId, isTyping });
    } catch {
      // Socket not ready — silently ignore typing indicators
    }
  },

  // ─── Set active conversation ────────────────────────────────────────────
  setActiveChat: (user) => {
    set({ activeChat: user, messages: [] });
  },

  // ─── Socket-driven updates ──────────────────────────────────────────────
  addMessage: (message) => {
    set((state) => {
      const exists = state.messages.some((m) => m._id === message._id);
      if (exists) return state;
      return { messages: [...state.messages, message] };
    });
  },

  updateMessageStatus: (messageId, status) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, status } : m,
      ),
    }));
  },

  setOnlineUsers: (userIds) => set({ onlineUsers: userIds }),

  setUserOnline: (userId) => {
    set((state) => {
      if (state.onlineUsers.includes(userId)) return state;
      return { onlineUsers: [...state.onlineUsers, userId] };
    });
  },

  setUserOffline: (userId) => {
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((id) => id !== userId),
    }));
  },

  setTyping: (userId, isTyping) => {
    set((state) => ({
      typingUsers: { ...state.typingUsers, [userId]: isTyping },
    }));
  },
}));
