import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LogOut, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChatStore } from '../../store/chatStore';
import { User } from '../../types';
import { formatLastSeen } from '../../utils/formatTime';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { users, activeChat, onlineUsers, setActiveChat, fetchUsers, fetchMessages } =
    useChatStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectUser = (selectedUser: User) => {
    setActiveChat(selectedUser);
    fetchMessages(selectedUser._id);
  };

  const isOnline = (userId: string) => onlineUsers.includes(userId);

  const getLastMessage = (_userId: string) => {
    // Could be enhanced to show last message preview
    return null;
  };

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-user">
          <div className="avatar-wrapper">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
              alt={user?.username}
              className="avatar"
            />
            <span className="status-dot online" />
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-username">{user?.username}</span>
            <span className="sidebar-status">Online</span>
          </div>
        </div>
        <motion.button
          className="icon-btn danger"
          onClick={logout}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Sign out"
        >
          <LogOut size={18} />
        </motion.button>
      </div>

      {/* App name */}
      <div className="sidebar-brand">
        <MessageCircle size={16} />
        <span>Pulse Chat</span>
      </div>

      {/* Search */}
      <div className="search-wrapper">
        <Search size={15} className="search-icon" />
        <input
          type="text"
          placeholder="Search people..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Users list */}
      <div className="users-list">
        <p className="users-label">
          {search ? `Results (${filteredUsers.length})` : `People (${users.length})`}
        </p>

        <AnimatePresence>
          {filteredUsers.length === 0 ? (
            <motion.div
              className="no-users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p>No users found</p>
            </motion.div>
          ) : (
            filteredUsers.map((u, i) => (
              <motion.div
                key={u._id}
                className={`user-item ${activeChat?._id === u._id ? 'active' : ''}`}
                onClick={() => handleSelectUser(u)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ x: 3 }}
              >
                <div className="avatar-wrapper">
                  <img
                    src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                    alt={u.username}
                    className="avatar"
                  />
                  <span className={`status-dot ${isOnline(u._id) ? 'online' : 'offline'}`} />
                </div>
                <div className="user-info">
                  <div className="user-name-row">
                    <span className="user-name">{u.username}</span>
                  </div>
                  <span className="user-status">
                    {isOnline(u._id)
                      ? 'Online'
                      : u.lastSeen
                      ? `Last seen ${formatLastSeen(u.lastSeen)}`
                      : 'Offline'}
                  </span>
                </div>
                {isOnline(u._id) && <span className="online-badge" />}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
};

export default Sidebar;
