import React, { useEffect, useState, useRef } from 'react';
import { Box, TextField, IconButton, Typography, CircularProgress, Paper, Avatar } from '@mui/material';
import { Send as SendIcon, AccountCircle } from '@mui/icons-material';
import { fetchChatDetail, sendMessage } from '../../api/communication';
import type { Message } from '../../api/communication';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { usersApiClient } from '../../api/clients';

interface ChatWidgetProps {
  chatId?: string;
  recipientId?: string;
  displayName?: string;
  chatType?: 'GENERAL' | 'SUBMISSION';
  submissionId?: string;
  onChatCreated?: (newChatId: string) => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ chatId, recipientId, chatType = 'GENERAL', submissionId, onChatCreated }) => {
  const { user } = useAuth();
  const { messagesStream, markChatAsRead, refreshChats } = useChat();
  const { showError } = useNotification();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      if (chatId) {
        setLoading(true);
        try {
          const detail = await fetchChatDetail(chatId, 100);
          const msgs = detail.messages.reverse(); // Reverse to show oldest first at top
          setMessages(msgs);
          markChatAsRead(chatId);

          // Resolve usernames for senders
          const uniqueSenders = Array.from(new Set(msgs.map(m => m.senderId)));
          if (uniqueSenders.length > 0) {
            try {
              const resolveRes = await usersApiClient.bulk.bulkResolveUsers({ subs: uniqueSenders });
              if (resolveRes.data.users) {
                setUserMap(prev => ({...prev, ...resolveRes.data.users}));
              }
            } catch (err) {
              console.error('Failed to resolve usernames', err);
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Failed to load chat messages.';
          showError(msg, 'Communication Service');
        } finally {
          setLoading(false);
        }
      } else {
        setMessages([]);
        setUserMap({});
      }
    };
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // Listen to SSE updates
  useEffect(() => {
    if (messagesStream && chatId) {
      // Only handle messages for this chat
      if (messagesStream.chatId === chatId) {
        const newMsg = messagesStream.message;
        setMessages(prev => {
          if (prev.find(m => m.messageId === newMsg.messageId)) return prev;
          return [...prev, newMsg];
        });
        markChatAsRead(chatId);

        // Resolve username if not present
        if (!userMap[newMsg.senderId]) {
          usersApiClient.bulk.bulkResolveUsers({ subs: [newMsg.senderId] })
            .then(res => {
              if (res.data.users) {
                setUserMap(prev => ({...prev, ...res.data.users}));
              }
            })
            .catch(err => console.error('Failed to resolve new message sender', err));
        }
      }
    }
  }, [messagesStream, chatId, markChatAsRead, userMap]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    // For GENERAL chats we need recipientId or chatId; for SUBMISSION chats we need submissionId
    const canSend = chatType === 'SUBMISSION'
      ? (submissionId && input.trim())
      : ((chatId || recipientId) && input.trim());
    
    if (!canSend) return;

    const body = input.trim();
    setInput('');
    
    // Optimistic UI update
    const tempMsg: Message = {
      messageId: `temp-${Date.now()}`,
      senderId: user?.id || '',
      body,
      sentAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const response = await sendMessage({
        recipientId: chatType === 'GENERAL' ? recipientId : undefined,
        body,
        chatContext: {
          type: chatType,
          submissionId
        }
      });

      // Update local messages (remove temp, append new from response)
      setMessages(prev => {
        const withoutTemp = prev.filter(m => !m.messageId.startsWith('temp-'));
        const newMsgs = response.messages.filter(nm => !withoutTemp.some(m => m.messageId === nm.messageId));
        return [...withoutTemp, ...newMsgs.reverse()];
      });
      refreshChats();
      const activeChatId = chatId || response.chatId;
      if (activeChatId) {
        markChatAsRead(activeChatId);
      }
      if (!chatId && onChatCreated) {
        onChatCreated(response.chatId);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send message.';
      showError(msg, 'Communication Service');
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map((msg) => {
          const isMine = msg.senderId === user?.id;
          return (
            <Box key={msg.messageId} sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              {!isMine && <Avatar sx={{ width: 32, height: 32, mr: 1, mt: 1 }}><AccountCircle /></Avatar>}
              <Box sx={{ maxWidth: '70%' }}>
                {!isMine && (
                  <Typography variant="caption" sx={{ ml: 0.5, mb: 0.5, display: 'block', color: 'text.secondary' }}>
                    {userMap[msg.senderId] || msg.senderId}
                  </Typography>
                )}
                <Paper sx={{ p: 1.5, bgcolor: isMine ? 'primary.main' : 'background.paper', color: isMine ? 'primary.contrastText' : 'text.primary', borderRadius: 2 }}>
                  <Typography variant="body1">{msg.body}</Typography>
                </Paper>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: isMine ? 'right' : 'left' }}>
                  {msg.sentAt ? formatDistanceToNow(new Date(msg.sentAt), { addSuffix: true }) : ''}
                </Typography>
              </Box>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
        />
        <IconButton color="primary" onClick={handleSend} disabled={!input.trim()}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};
