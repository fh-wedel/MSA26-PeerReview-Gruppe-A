import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useAuth } from './AuthContext';
import { fetchChats } from '../api/communication';
import type { ChatSummary, Message } from '../api/communication';

interface ChatContextType {
  chats: ChatSummary[];
  unreadCount: number;
  refreshChats: () => Promise<void>;
  markChatAsRead: (chatId: string) => void;
  messagesStream: Message | null;
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
  const { isAuthenticated } = useAuth();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messagesStream, setMessagesStream] = useState<Message | null>(null);

  // For unread counts, we assume local state tracks if we've opened a chat.
  // We'll keep a simple Map or Set of read chat timestamps if not supported by backend.
  // Actually, the backend doesn't store unread count. We'll derive it by tracking locally seen messages.
  const [readTimestamps, setReadTimestamps] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('chat_read_timestamps');
    return saved ? JSON.parse(saved) : {};
  });

  const updateReadTimestamps = (newMap: Record<string, string>) => {
    setReadTimestamps(newMap);
    localStorage.setItem('chat_read_timestamps', JSON.stringify(newMap));
  };

  const refreshChats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await fetchChats();
      // Sort by lastMessageAt descending
      const sorted = data.chats.sort((a, b) => {
        const da = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const db = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return db - da;
      });
      setChats(sorted);

      // Calculate unread
      let unread = 0;
      sorted.forEach(c => {
        if (c.lastMessageAt) {
          const lastRead = readTimestamps[c.chatId];
          if (!lastRead || new Date(c.lastMessageAt) > new Date(lastRead)) {
            unread++;
          }
        }
      });
      setUnreadCount(unread);
    } catch (e) {
      console.error('Failed to fetch chats', e);
    }
  }, [isAuthenticated, readTimestamps]);

  const markChatAsRead = useCallback((chatId: string) => {
    const chat = chats.find(c => c.chatId === chatId);
    if (chat && chat.lastMessageAt) {
      const newMap = { ...readTimestamps, [chatId]: chat.lastMessageAt };
      updateReadTimestamps(newMap);
      // Re-eval unread count
      let unread = 0;
      chats.forEach(c => {
        if (c.lastMessageAt) {
          const lastRead = newMap[c.chatId];
          if (!lastRead || new Date(c.lastMessageAt) > new Date(lastRead)) {
            unread++;
          }
        }
      });
      setUnreadCount(unread);
    }
  }, [chats, readTimestamps]);

  useEffect(() => {
    refreshChats();
  }, [refreshChats]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = sessionStorage.getItem('id_token') || sessionStorage.getItem('access_token');
    if (!token) return;

    let abortController = new AbortController();

    const connectSSE = () => {
      fetchEventSource('/api/communication/chats/stream', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        signal: abortController.signal,
        async onmessage(ev) {
          if (ev.event === 'message') {
            try {
              const data = JSON.parse(ev.data); // { chatId: ..., message: ... }
              const newMsg = data.message as Message;
              const chatId = data.chatId;

              // Propagate to current view
              setMessagesStream({ ...newMsg, messageId: newMsg.messageId + '-' + chatId }); 
              
              // We need to refresh chats to update the sidebar and unread counts
              // We can just call refreshChats() which fetches the latest list
              // But to avoid a race condition with local state, we do it in a small timeout
              setTimeout(refreshChats, 500);
            } catch (err) {
              console.error('Error parsing SSE message', err);
            }
          }
        },
        onclose() {
          // fetchEventSource automatically reconnects on clean close
        },
        onerror(err) {
          console.error('SSE Error', err);
          // throw error to let fetchEventSource attempt to reconnect
          throw err; 
        }
      }).catch(err => {
         console.warn('SSE disconnected, will try again later', err);
      });
    };

    connectSSE();

    return () => {
      abortController.abort();
    };
  }, [isAuthenticated]);

  return (
    <ChatContext.Provider value={{ chats, unreadCount, refreshChats, markChatAsRead, messagesStream }}>
      {children}
    </ChatContext.Provider>
  );
};
