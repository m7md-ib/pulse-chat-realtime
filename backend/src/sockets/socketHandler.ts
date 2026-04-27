import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Message } from '../models/Message';
import mongoose from 'mongoose';

interface JwtPayload {
  userId: string;
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

// Map: userId -> socketId
const onlineUsers = new Map<string, string>();

export const initializeSocket = (io: Server): void => {
  // JWT authentication middleware for socket
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers['authorization']?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback_secret'
      ) as JwtPayload;

      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      next();
    } catch {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    console.log(`🔌 User connected: ${socket.username} (${userId})`);

    // Join personal room
    socket.join(userId);

    // Mark user as online
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // Broadcast updated online users list
    const onlineUserIds = Array.from(onlineUsers.keys());
    io.emit('online_users', onlineUserIds);

    // Mark messages as delivered when user connects
    await Message.updateMany(
      { receiverId: userId, status: 'sent' },
      { status: 'delivered' }
    );

    // ── send_message ──────────────────────────────────────
    socket.on(
      'send_message',
      async (data: { receiverId: string; content: string }) => {
        try {
          const { receiverId, content } = data;

          if (!content?.trim() || !receiverId) return;
          if (!mongoose.Types.ObjectId.isValid(receiverId)) return;

          const isReceiverOnline = onlineUsers.has(receiverId);

          const message = await Message.create({
            senderId: userId,
            receiverId,
            content: content.trim(),
            status: isReceiverOnline ? 'delivered' : 'sent',
          });

          const populatedMessage = await Message.findById(message._id)
            .populate('senderId', 'username avatar')
            .populate('receiverId', 'username avatar');

          // Emit to sender
          socket.emit('receive_message', populatedMessage);

          // Emit to receiver (if online)
          if (isReceiverOnline) {
            socket.to(receiverId).emit('receive_message', populatedMessage);
          }
        } catch (error) {
          console.error('send_message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      }
    );

    // ── typing ────────────────────────────────────────────
    socket.on('typing', (data: { receiverId: string; isTyping: boolean }) => {
      const { receiverId, isTyping } = data;
      socket.to(receiverId).emit('user_typing', {
        userId,
        username: socket.username,
        isTyping,
      });
    });

    // ── mark_seen ─────────────────────────────────────────
    socket.on('mark_seen', async (data: { senderId: string }) => {
      try {
        await Message.updateMany(
          { senderId: data.senderId, receiverId: userId, status: { $ne: 'seen' } },
          { status: 'seen' }
        );

        // Notify the original sender their messages were seen
        socket.to(data.senderId).emit('messages_seen', { by: userId });
      } catch (error) {
        console.error('mark_seen error:', error);
      }
    });

    // ── disconnect ────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.username}`);
      onlineUsers.delete(userId);

      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      const onlineUserIds = Array.from(onlineUsers.keys());
      io.emit('online_users', onlineUserIds);
    });
  });
};
