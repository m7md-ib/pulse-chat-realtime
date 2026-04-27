import React from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { Message } from '../../types';
import { formatTime } from '../../utils/formatTime';
import { useAuth } from '../../context/AuthContext';

interface Props {
  message: Message;
  showAvatar?: boolean;
}

const StatusIcon: React.FC<{ status: Message['status'] }> = ({ status }) => {
  if (status === 'seen') return <CheckCheck size={14} className="status-seen" />;
  if (status === 'delivered') return <CheckCheck size={14} className="status-delivered" />;
  return <Check size={14} className="status-sent" />;
};

const MessageBubble: React.FC<Props> = ({ message, showAvatar }) => {
  const { user } = useAuth();

  const senderId =
    typeof message.senderId === 'string'
      ? message.senderId
      : message.senderId._id;

  const senderAvatar =
    typeof message.senderId === 'object' ? message.senderId.avatar : undefined;
  const senderUsername =
    typeof message.senderId === 'object' ? message.senderId.username : 'User';

  const isMine = senderId === user?._id;

  return (
    <motion.div
      className={`message-row ${isMine ? 'mine' : 'theirs'}`}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {!isMine && showAvatar && (
        <img
          src={senderAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderUsername}`}
          alt={senderUsername}
          className="msg-avatar"
        />
      )}
      {!isMine && !showAvatar && <div className="msg-avatar-spacer" />}

      <div className={`bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'}`}>
        <p className="bubble-text">{message.content}</p>
        <div className="bubble-meta">
          <span className="bubble-time">{formatTime(message.createdAt)}</span>
          {isMine && <StatusIcon status={message.status} />}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
