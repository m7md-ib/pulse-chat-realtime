import React from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { useSocket } from '../../hooks/useSocket';

const ChatLayout: React.FC = () => {
  useSocket();

  return (
    <div className="chat-layout">
      <Sidebar />
      <ChatWindow />
    </div>
  );
};

export default ChatLayout;
