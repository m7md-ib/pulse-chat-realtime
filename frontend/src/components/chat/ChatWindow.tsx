import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../../store/chatStore';
import { useAuth } from '../../context/AuthContext';
import MessageBubble from './MessageBubble';
import InputBox from './InputBox';
import { Message } from '../../types';
import { formatDate } from '../../utils/formatTime';
import { getSocket } from '../../services/socket';

const TypingIndicator: React.FC = () => (
  <motion.div
    className="typing-indicator"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
  >
    <div className="typing-dots">
      <span />
      <span />
      <span />
    </div>
    <span className="typing-text">typing...</span>
  </motion.div>
);

const shouldShowAvatar = (messages: Message[], index: number, currentId: string): boolean => {
  if (index === 0) return true;
  const prev = messages[index - 1];
  const prevSenderId = typeof prev.senderId === 'string' ? prev.senderId : prev.senderId._id;
  return prevSenderId !== currentId;
};

const ChatWindow: React.FC = () => {
  const { activeChat, messages, isLoadingMessages, typingUsers, onlineUsers } = useChatStore();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isTyping = activeChat ? typingUsers[activeChat._id] : false;
  const isOnline = activeChat ? onlineUsers.includes(activeChat._id) : false;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Mark messages as seen when chat is open
  useEffect(() => {
    if (!activeChat || !user) return;
    try {
      const socket = getSocket();
      socket.emit('mark_seen', { senderId: activeChat._id });
    } catch {
      // socket not ready
    }
  }, [activeChat, messages.length]);

  if (!activeChat) {
    return (
      <div className="chat-empty">
        <motion.div
          className="chat-empty-content"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="empty-icon">💬</div>
          <h2>Select a conversation</h2>
          <p>Choose someone from the sidebar to start chatting</p>
        </motion.div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.createdAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (!last || last.date !== date) {
      groupedMessages.push({ date, messages: [msg] });
    } else {
      last.messages.push(msg);
    }
  });

  return (
    <div className="chat-window">
      {/* Chat header */}
      <div className="chat-header">
        <div className="chat-header-user">
          <div className="avatar-wrapper">
            <img
              src={activeChat.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat.username}`}
              alt={activeChat.username}
              className="avatar"
            />
            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
          </div>
          <div>
            <h3 className="chat-header-name">{activeChat.username}</h3>
            <p className="chat-header-status">
              {isTyping ? (
                <span className="typing-status">typing...</span>
              ) : isOnline ? (
                'Online'
              ) : (
                'Offline'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {isLoadingMessages ? (
          <div className="messages-loading">
            <div className="loading-spinner" />
          </div>
        ) : messages.length === 0 ? (
          <div className="messages-empty">
            <p>No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date} className="message-group">
              <div className="date-divider">
                <span>{group.date}</span>
              </div>
              {group.messages.map((msg, i) => {
                const senderId =
                  typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id;
                const prevInGroup = group.messages[i - 1];
                const prevSenderId = prevInGroup
                  ? typeof prevInGroup.senderId === 'string'
                    ? prevInGroup.senderId
                    : prevInGroup.senderId._id
                  : null;
                const showAvatar = prevSenderId !== senderId;
                return (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    showAvatar={showAvatar}
                  />
                );
              })}
            </div>
          ))
        )}

        <AnimatePresence>
          {isTyping && <TypingIndicator key="typing" />}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <InputBox receiverId={activeChat._id} />
    </div>
  );
};

export default ChatWindow;
