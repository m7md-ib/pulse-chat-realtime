import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';

interface Props {
  receiverId: string;
}

const InputBox: React.FC<Props> = ({ receiverId }) => {
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { sendMessage, sendTyping } = useChatStore();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const stopTyping = useCallback(() => {
    if (isTyping) {
      setIsTyping(false);
      sendTyping(receiverId, false);
    }
  }, [isTyping, receiverId, sendTyping]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Typing indicator logic
    if (!isTyping) {
      setIsTyping(true);
      sendTyping(receiverId, true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 1500);
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    sendMessage(receiverId, trimmed);
    setContent('');
    stopTyping();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  return (
    <div className="input-box">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message... (Enter to send)"
        rows={1}
        className="message-input"
      />
      <motion.button
        className={`send-btn ${content.trim() ? 'active' : ''}`}
        onClick={handleSend}
        disabled={!content.trim()}
        whileHover={{ scale: content.trim() ? 1.05 : 1 }}
        whileTap={{ scale: content.trim() ? 0.95 : 1 }}
      >
        <Send size={18} />
      </motion.button>
    </div>
  );
};

export default InputBox;
