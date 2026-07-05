import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { handleChatSseMessage } from '../utils/chatContextHelpers';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { fetchChats } from '../api/communication';
import type { ChatSummary, Message } from '../api/communication';

interface ChatContextType {
  chats: ChatSummary[];
  unreadCount: number;
  refreshChats: () => Promise<void>;
  markChatAsRead: (chatId: string) => void;
  messagesStream: { message: Message; chatId: string } | null;
}

const ChatContext = createContext<ChatContextType>({
  chats: [],
  unreadCount: 0,
  refreshChats: async () => {},
  markChatAsRead: () => {},
  messagesStream: null,
});

export const useChat = () => useContext(ChatContext);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { showError } = useNotification();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messagesStream, setMessagesStream] = useState<{ message: Message; chatId: string } | null>(null);

  const [readTimestamps, setReadTimestamps] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('chat_read_timestamps');
    return saved ? JSON.parse(saved) : {};
  });

  const refreshChats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await fetchChats();
      const sorted = data.chats.sort((a, b) => {
        const da = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const db = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return db - da;
      });
      setChats(sorted);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load chats.';
      showError(msg, 'Communication Service');
    }
  }, [isAuthenticated, showError]);

  // Derive unread count from chats + local read timestamps
  useEffect(() => {
    let unread = 0;
    chats.forEach(c => {
      if (c.lastMessageAt) {
        const lastRead = readTimestamps[c.chatId];
        if (!lastRead || new Date(c.lastMessageAt) > new Date(lastRead)) {
          unread++;
        }
      }
    });
    setUnreadCount(unread);
  }, [chats, readTimestamps]);

  const markChatAsRead = useCallback((chatId: string) => {
    setReadTimestamps(prev => {
      const now = new Date().toISOString();
      const newMap = { ...prev, [chatId]: now };
      localStorage.setItem('chat_read_timestamps', JSON.stringify(newMap));
      return newMap;
    });
  }, []);

  // Initial load
  useEffect(() => {
    refreshChats();
  }, [refreshChats]);

  // SSE: Subscribe to real-time message events from the communication service.
  // The backend SseEmitter completes immediately after sending an event so the
  // Lambda proxy's `await response.text()` resolves and returns the event data
  // to the browser before the 29s API Gateway timeout. The idle timeout is 25s
  // so connections without events also close cleanly. fetchEventSource reconnects
  // automatically in both cases.
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = sessionStorage.getItem('access_token');
    if (!token) return;

    const abortController = new AbortController();

    fetchEventSource(`/api/communication/chats/stream?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      signal: abortController.signal,
      openWhenHidden: true, // Prevents disconnection when the tab loses focus
      async onmessage(ev) {
        handleChatSseMessage(ev, user?.id, setMessagesStream, refreshChats);
      },
      onclose() {
        // The backend closes the emitter after each event (required for Lambda proxy compatibility).
        // fetchEventSource treats a clean 200 close as "done" and stops retrying.
        // Throwing here routes through onerror which returns without throwing → library reconnects.
        throw new Error('SSE stream closed by server — reconnecting');
      },
      onerror(err) {
        console.warn('SSE connection error, will reconnect automatically.', err);
        // Return nothing — fetchEventSource retries on its own
      },
    }).catch(() => {
      // Aborted or permanently failed — ignore
    });

    return () => {
      abortController.abort();
    };
  }, [isAuthenticated, user, refreshChats]);

  return (
    <ChatContext.Provider value={{ chats, unreadCount, refreshChats, markChatAsRead, messagesStream }}>
      {children}
    </ChatContext.Provider>
  );
};
