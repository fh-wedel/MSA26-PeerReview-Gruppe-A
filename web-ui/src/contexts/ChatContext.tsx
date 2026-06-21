import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
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

    console.log('[SSE] Starting SSE connection loop. URL:', `/api/communication/chats/stream?t=${Date.now()}`);
    
    fetchEventSource(`/api/communication/chats/stream?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      signal: abortController.signal,
      async onopen(response) {
        console.log(`[SSE] Connection opened! Status: ${response.status} ${response.statusText}`);
        if (response.status >= 400 && response.status < 600) {
          console.error(`[SSE] Error response from server: ${response.status}`);
          // Throwing an error here triggers onerror() and then it retries.
          throw new Error(`Server returned status: ${response.status}`);
        }
      },
      async onmessage(ev) {
        if (!ev.event || ev.event === 'message') {
          console.log('[SSE] Received event:', ev.event, 'Data:', ev.data);
          try {
            const data = JSON.parse(ev.data);
            const newMsg = data.message as Message;
            const chatId = data.chatId;

            console.log(`[SSE] Parsed message from senderId=${newMsg?.senderId} for chatId=${chatId} (currentUser=${user?.id})`);

            // Only propagate to the chat widget if this message is from the *other* user.
            // Our own messages are already handled optimistically in ChatWidget.
            if (newMsg.senderId !== user?.id) {
              setMessagesStream({ message: newMsg, chatId });
            } else {
              console.log(`[SSE] Ignored message from self.`);
            }

            // Refresh the chat list so lastMessageAt and unread count are updated.
            setTimeout(refreshChats, 500);
          } catch (err) {
            console.error('[SSE] Error parsing SSE message! Raw data was:', ev.data, err);
          }
        } else {
          console.log('[SSE] Received non-message event:', ev.event, 'Data:', ev.data);
        }
      },
      onclose() {
        console.log('[SSE] Connection closed cleanly by server (200 OK EOF). fetchEventSource will retry automatically.');
        // The backend closes the emitter after each event (required for Lambda proxy compatibility).
        // fetchEventSource treats a clean 200 close as "done" and stops retrying.
        // Throwing here routes through onerror which returns without throwing → library reconnects.
        throw new Error('SSE stream closed by server — reconnecting');
      },
      onerror(err) {
        console.warn('[SSE] Connection error! Will reconnect automatically in 1s.', err);
        // Return nothing — fetchEventSource retries on its own
      },
    }).catch((err) => {
      console.error('[SSE] fetchEventSource permanently aborted or failed fatally:', err);
    });

    return () => {
      console.log('[SSE] Aborting connection due to component unmount or dependencies change.');
      abortController.abort();
    };
  }, [isAuthenticated, user, refreshChats]);

  return (
    <ChatContext.Provider value={{ chats, unreadCount, refreshChats, markChatAsRead, messagesStream }}>
      {children}
    </ChatContext.Provider>
  );
};
