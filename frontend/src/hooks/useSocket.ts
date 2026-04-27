import { useEffect } from 'react';
import { getSocket } from '../services/socket';
import { useChatStore } from '../store/chatStore';
import { useAuth } from '../context/AuthContext';
import { Message } from '../types';

export const useSocket = () => {
  const { user } = useAuth();
  const { addMessage, setOnlineUsers, setTypingUser, activeChat } = useChatStore();

  useEffect(() => {
    if (!user) return;

    let socket;
    try {
      socket = getSocket();
    } catch {
      return;
    }

    const handleReceiveMessage = (message: Message) => {
      addMessage(message);

      // Mark as seen if chat is open and message is from active chat user
      const senderId =
        typeof message.senderId === 'string'
          ? message.senderId
          : message.senderId._id;

      if (activeChat && senderId === activeChat._id) {
        socket.emit('mark_seen', { senderId: activeChat._id });
      }
    };

    const handleOnlineUsers = (userIds: string[]) => {
      setOnlineUsers(userIds);
    };

    const handleUserTyping = (data: {
      userId: string;
      username: string;
      isTyping: boolean;
    }) => {
      setTypingUser(data.userId, data.isTyping);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('online_users', handleOnlineUsers);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('online_users', handleOnlineUsers);
      socket.off('user_typing', handleUserTyping);
    };
  }, [user, activeChat, addMessage, setOnlineUsers, setTypingUser]);
};
