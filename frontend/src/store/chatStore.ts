import { create } from 'zustand';
import { User, Message } from '../types';
import api from '../services/api';
import { getSocket } from '../services/socket';

interface ChatStore {
  users: User[];
  activeChat: User | null;
  messages: Message[];
  onlineUsers: string[];
  typingUsers: Record<string, boolean>;
  isLoadingMessages: boolean;

  setUsers: (users: User[]) => void;
  setActiveChat: (user: User | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setOnlineUsers: (userIds: string[]) => void;
  setTypingUser: (userId: string, isTyping: boolean) => void;
  updateMessageStatus: (messageId: string, status: Message['status']) => void;

  fetchUsers: () => Promise<void>;
  fetchMessages: (userId: string) => Promise<void>;
  sendMessage: (receiverId: string, content: string) => void;
  sendTyping: (receiverId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  users: [],
  activeChat: null,
  messages: [],
  onlineUsers: [],
  typingUsers: {},
  isLoadingMessages: false,

  setUsers: (users) => set({ users }),
  setActiveChat: (user) => set({ activeChat: user }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => {
      // Avoid duplicates
      const exists = state.messages.find((m) => m._id === message._id);
      if (exists) return state;
      return { messages: [...state.messages, message] };
    }),
  setOnlineUsers: (userIds) => set({ onlineUsers: userIds }),
  setTypingUser: (userId, isTyping) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [userId]: isTyping },
    })),
  updateMessageStatus: (messageId, status) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, status } : m
      ),
    })),

  fetchUsers: async () => {
    try {
      const { data } = await api.get('/users');
      set({ users: data.users });
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  },

  fetchMessages: async (userId: string) => {
    set({ isLoadingMessages: true });
    try {
      const { data } = await api.get(`/messages/${userId}`);
      set({ messages: data.messages });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: (receiverId: string, content: string) => {
    try {
      const socket = getSocket();
      socket.emit('send_message', { receiverId, content });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  },

  sendTyping: (receiverId: string, isTyping: boolean) => {
    try {
      const socket = getSocket();
      socket.emit('typing', { receiverId, isTyping });
    } catch {
      // Socket not ready
    }
  },
}));
