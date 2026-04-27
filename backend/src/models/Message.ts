import mongoose, { Document, Schema } from 'mongoose';

export type MessageStatus = 'sent' | 'delivered' | 'seen';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  content: string;
  status: MessageStatus;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'seen'],
      default: 'sent',
    },
  },
  { timestamps: true }
);

// Index for faster queries on chat history
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
