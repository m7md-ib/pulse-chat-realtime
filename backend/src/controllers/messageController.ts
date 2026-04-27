import { Response } from 'express';
import mongoose from 'mongoose';
import { Message } from '../models/Message';
import { AuthRequest } from '../middleware/auth';

export const getChatHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('senderId', 'username avatar')
      .populate('receiverId', 'username avatar');

    // Mark messages sent to current user as 'seen'
    await Message.updateMany(
      {
        senderId: userId,
        receiverId: currentUserId,
        status: { $ne: 'seen' },
      },
      { status: 'seen' }
    );

    res.json({ messages });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
