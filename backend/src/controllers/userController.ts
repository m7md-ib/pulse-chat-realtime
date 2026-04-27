import { Response } from 'express';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find({ _id: { $ne: req.user!._id } })
      .select('-password')
      .sort({ isOnline: -1, username: 1 });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
