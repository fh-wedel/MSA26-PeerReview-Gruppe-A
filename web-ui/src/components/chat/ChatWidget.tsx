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

const canSendMessage = (chatType: string, input: string, submissionId?: string, chatId?: string, recipientId?: string): boolean => {
  if (!input.trim()) return false;
  if (chatType === 'SUBMISSION') return !!submissionId;
  return !!(chatId || recipientId);
};

const createTempMessage = (body: string, userId?: string): Message => ({
  messageId: `temp-${Date.now()}`,
  senderId: userId || '',
  body,
  sentAt: new Date().toISOString()
});

const isNotTemp = (m: Message) => !m.messageId.startsWith('temp-');
const isNewMessage = (nm: Message, currentMsgs: Message[]) => !currentMsgs.some(m => m.messageId === nm.messageId);

const updateMessagesAfterSend = (prev: Message[], responseMessages: Message[]): Message[] => {
  const withoutTemp = prev.filter(isNotTemp);
  const newMsgs = responseMessages.filter(nm => isNewMessage(nm, withoutTemp));
  return [...withoutTemp, ...newMsgs.reverse()];
};

const handlePostSendActions = (
  responseChatId: string,
  refreshChats: () => void,
  markChatAsRead: (id: string) => void,
  chatId?: string,
  onChatCreated?: (id: string) => void
) => {
  refreshChats();
  const activeChatId = chatId || responseChatId;
  if (activeChatId) markChatAsRead(activeChatId);
  if (!chatId && onChatCreated) onChatCreated(responseChatId);
};

const getErrorMessage = (err: unknown): string => {
  return err instanceof Error ? err.message : 'Failed to send message.';
};

const getRecipientId = (chatType: string, recipientId?: string) => {
  return chatType === 'GENERAL' ? recipientId : undefined;
};

const resolveUsernames = async (
  userIds: string[],
  setUserMap: React.Dispatch<React.SetStateAction<Record<string, string>>>
) => {
  const uniqueIds = Array.from(new Set(userIds));
  if (uniqueIds.length === 0) return;
  try {
    const res = await usersApiClient.bulk.bulkResolveUsers({ subs: uniqueIds });
    if (res.data.users) {
      setUserMap(prev => ({...prev, ...res.data.users}));
    }
  } catch (err) {
    console.error('Failed to resolve usernames', err);
  }
};

const MyMessageItem = ({ msg }: { msg: Message }) => (
  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
    <Box sx={{ maxWidth: '70%' }}>
      <Paper sx={{ p: 1.5, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2 }}>
        <Typography variant="body1">{msg.body}</Typography>
      </Paper>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}>
        {msg.sentAt ? formatDistanceToNow(new Date(msg.sentAt), { addSuffix: true }) : ''}
      </Typography>
    </Box>
  </Box>
);

const OtherMessageItem = ({ msg, username }: { msg: Message, username: string }) => (
  <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
    <Avatar sx={{ width: 32, height: 32, mr: 1, mt: 1 }}><AccountCircle /></Avatar>
    <Box sx={{ maxWidth: '70%' }}>
      <Typography variant="caption" sx={{ ml: 0.5, mb: 0.5, display: 'block', color: 'text.secondary' }}>
        {username}
      </Typography>
      <Paper sx={{ p: 1.5, bgcolor: 'background.paper', color: 'text.primary', borderRadius: 2 }}>
        <Typography variant="body1">{msg.body}</Typography>
      </Paper>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'left' }}>
        {msg.sentAt ? formatDistanceToNow(new Date(msg.sentAt), { addSuffix: true }) : ''}
      </Typography>
    </Box>
  </Box>
);

const ChatMessageItem = ({ msg, isMine, username }: { msg: Message, isMine: boolean, username: string }) => {
  if (isMine) return <MyMessageItem msg={msg} />;
  return <OtherMessageItem msg={msg} username={username} />;
};

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
      if (!chatId) {
        setMessages([]);
        setUserMap({});
        return;
      }

      setLoading(true);
      try {
        const detail = await fetchChatDetail(chatId, 100);
        const msgs = detail.messages.reverse(); // Reverse to show oldest first at top
        setMessages(msgs);
        markChatAsRead(chatId);
        await resolveUsernames(msgs.map(m => m.senderId), setUserMap);
      } catch (err) {
        showError(getErrorMessage(err), 'Communication Service');
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // Listen to SSE updates
  useEffect(() => {
    if (messagesStream && messagesStream.chatId === chatId && chatId) {
      const newMsg = messagesStream.message;
      setMessages(prev => prev.some(m => m.messageId === newMsg.messageId) ? prev : [...prev, newMsg]);
      markChatAsRead(chatId);

      if (!userMap[newMsg.senderId]) {
        resolveUsernames([newMsg.senderId], setUserMap);
      }
    }
  }, [messagesStream, chatId, markChatAsRead, userMap]);

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const handleSend = async () => {
    if (!canSendMessage(chatType, input, submissionId, chatId, recipientId)) return;

    const body = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, createTempMessage(body, user?.id)]);

    try {
      const response = await sendMessage({
        recipientId: getRecipientId(chatType, recipientId),
        body,
        chatContext: { type: chatType, submissionId }
      });

      setMessages(prev => updateMessagesAfterSend(prev, response.messages));
      handlePostSendActions(response.chatId, refreshChats, markChatAsRead, chatId, onChatCreated);
    } catch (err) {
      showError(getErrorMessage(err), 'Communication Service');
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map((msg) => (
          <React.Fragment key={msg.messageId}>
            <ChatMessageItem msg={msg} isMine={msg.senderId === user?.id} username={userMap[msg.senderId] || msg.senderId} />
          </React.Fragment>
        ))}
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
