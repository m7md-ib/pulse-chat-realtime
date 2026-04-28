import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getSocket, isSocketConnected } from "../services/socket";
import { useChatStore } from "../store/chatStore";
import { Message } from "../types";

/**
 * Registers all socket event listeners for the chat app.
 * Must be called once — inside ChatLayout (authenticated area only).
 */
export const useSocket = () => {
  const { isAuthenticated } = useAuth();
  const {
    addMessage,
    updateMessageStatus,
    setOnlineUsers,
    setUserOnline,
    setUserOffline,
    setTyping,
    activeChat,
  } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Wait a tick for socket to be ready after auth
    const timeoutId = setTimeout(() => {
      if (!isSocketConnected()) return;

      let socket: ReturnType<typeof getSocket>;
      try {
        socket = getSocket();
      } catch {
        return;
      }

      // ─── Incoming message ─────────────────────────────────────────────
      socket.on("receive_message", (message: Message) => {
        addMessage(message);

        // Auto-mark as seen if the chat is currently open
        const senderId =
          typeof message.senderId === "string"
            ? message.senderId
            : message.senderId._id;

        if (activeChat?._id === senderId) {
          socket.emit("mark_seen", { senderId });
        }
      });

      // ─── Message sent confirmation ────────────────────────────────────
      socket.on("message_sent", (message: Message) => {
        addMessage(message);
      });

      // ─── Message status updates ───────────────────────────────────────
      socket.on(
        "message_status",
        ({
          messageId,
          status,
        }: {
          messageId: string;
          status: Message["status"];
        }) => {
          updateMessageStatus(messageId, status);
        },
      );

      // ─── Online status ────────────────────────────────────────────────
      socket.on("online_users", (userIds: string[]) => {
        setOnlineUsers(userIds);
      });

      socket.on("user_online", ({ userId }: { userId: string }) => {
        setUserOnline(userId);
      });

      socket.on("user_offline", ({ userId }: { userId: string }) => {
        setUserOffline(userId);
      });

      // ─── Typing indicators ────────────────────────────────────────────
      socket.on(
        "typing",
        ({ senderId, isTyping }: { senderId: string; isTyping: boolean }) => {
          setTyping(senderId, isTyping);
        },
      );
    }, 100);

    return () => {
      clearTimeout(timeoutId);

      // Clean up listeners only — don't disconnect the socket here
      if (isSocketConnected()) {
        try {
          const socket = getSocket();
          socket.off("receive_message");
          socket.off("message_sent");
          socket.off("message_status");
          socket.off("online_users");
          socket.off("user_online");
          socket.off("user_offline");
          socket.off("typing");
        } catch {
          // Socket already gone
        }
      }
    };
  }, [isAuthenticated]);

  // Re-register "receive_message" when activeChat changes
  // so auto-mark-seen uses the latest activeChat value
  useEffect(() => {
    if (!isAuthenticated || !isSocketConnected()) return;

    let socket: ReturnType<typeof getSocket>;
    try {
      socket = getSocket();
    } catch {
      return;
    }

    const handleMessage = (message: Message) => {
      addMessage(message);
      const senderId =
        typeof message.senderId === "string"
          ? message.senderId
          : message.senderId._id;
      if (activeChat?._id === senderId) {
        socket.emit("mark_seen", { senderId });
      }
    };

    socket.off("receive_message");
    socket.on("receive_message", handleMessage);

    return () => {
      socket.off("receive_message", handleMessage);
    };
  }, [activeChat, isAuthenticated]);
};
