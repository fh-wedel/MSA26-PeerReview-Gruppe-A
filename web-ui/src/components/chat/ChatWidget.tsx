import React, { useEffect, useState, useRef } from 'react';
import { Box, TextField, IconButton, Typography, CircularProgress, Paper, Avatar } from '@mui/material';
import { Send as SendIcon, AccountCircle } from '@mui/icons-material';
import { fetchChatDetail, sendMessage } from '../../api/communication';
import type { Message } from '../../api/communication';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface ChatWidgetProps {
  chatId?: string;
  recipientId?: string;
  chatType?: 'GENERAL' | 'SUBMISSION';
  submissionId?: string;
  onChatCreated?: (newChatId: string) => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ chatId, recipientId, chatType = 'GENERAL', submissionId, onChatCreated }) => {
  const { user } = useAuth();
  const { messagesStream, markChatAsRead, refreshChats } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      if (chatId) {
        setLoading(true);
        try {
          const detail = await fetchChatDetail(chatId, 100);
          setMessages(detail.messages.reverse()); // Reverse to show oldest first at top
          markChatAsRead(chatId);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        setMessages([]);
      }
    };
    loadMessages();
  }, [chatId, markChatAsRead]);

  // Listen to SSE updates
  useEffect(() => {
    if (messagesStream && chatId) {
      // Check if message belongs to this chat
      // The stream sends {chatId, message} but we only mapped it to message with messageId extended
      // Let's assume we can match by checking if messageId ends with chatId or we should just refresh
      // Alternatively, we appended chatId to messageId in ChatContext: `newMsg.messageId + '-' + chatId`
      if (messagesStream.messageId.endsWith('-' + chatId)) {
        // Remove the chatId part from messageId
        const cleanMsg = { ...messagesStream, messageId: messagesStream.messageId.replace('-' + chatId, '') };
        setMessages(prev => {
          if (prev.find(m => m.messageId === cleanMsg.messageId)) return prev;
          return [...prev, cleanMsg];
        });
        markChatAsRead(chatId);
      }
    }
  }, [messagesStream, chatId, markChatAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || (!chatId && !recipientId)) return;

    const body = input.trim();
    setInput('');
    try {
      // If we only have recipientId, the backend creates the chat
      const response = await sendMessage({
        recipientId: recipientId || '', // In practice, if chatId exists, we still need recipientId? Actually backend requires recipientId. 
        // Wait, if we have chatId but don't know recipientId? We should get it from the chat details.
        // Actually, if we are in an existing chat, we know the other participant from the ChatSummary.
        // So the parent should always pass `recipientId`.
        body,
        chatContext: {
          type: chatType,
          submissionId
        }
      });

      // Update local messages
      setMessages(response.messages.reverse());
      refreshChats();
      if (!chatId && onChatCreated) {
        onChatCreated(response.chatId);
      }
    } catch (err) {
      console.error('Failed to send message', err);
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
