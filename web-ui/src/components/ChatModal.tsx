import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  IconButton,
  Button,
  Paper
} from '@mui/material';
import { Close, Send, AccountCircle, FormatBold, FormatItalic, FormatUnderlined } from '@mui/icons-material';
import type { ChatThread, ChatUser } from '../stubs/chats';
import { format } from 'date-fns';

interface ChatModalProps {
  open: boolean;
  onClose: () => void;
  threads: ChatThread[];
  selectedThreadId: string | null;
  currentUserId: string;
  users: ChatUser[];
  onSelectThread: (threadId: string) => void;
  onSendMessage: (threadId: string, text: string, msgFormat?: { bold?: boolean; italic?: boolean; underline?: boolean }) => void;
  onStartChat: (userId: string) => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  open,
  onClose,
  threads,
  selectedThreadId,
  currentUserId,
  users,
  onSelectThread,
  onSendMessage,
  onStartChat
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const selectedThread = threads.find(t => t.id === selectedThreadId);

  const filteredUsers = users.filter(u => 
    u.id !== currentUserId && 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = () => {
    if (messageText.trim() && selectedThreadId) {
      onSendMessage(selectedThreadId, messageText, {
        bold: isBold,
        italic: isItalic,
        underline: isUnderline
      });
      setMessageText('');
      // Optional: reset formats after sending? The prompt says "maintain local toggle state and apply to newly sent message." 
      // This implies we don't necessarily reset it, or maybe we do? Let's leave it as is so it maintains state.
    }
  };

  const getThreadDisplayName = (thread: ChatThread) => {
    return thread.participants
      .filter(p => p.id !== currentUserId)
      .map(p => p.name)
      .join(', ') || 'Unknown';
  };

  const handleStartChat = (userId: string) => {
    setSearchQuery('');
    onStartChat(userId);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { height: '80vh' } }}>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Messages</Typography>
        <IconButton onClick={onClose} aria-label="close">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', p: 0 }}>
        {/* Left pane: User Search and Threads List */}
        <Box sx={{ width: '30%', borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Box>
          <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
            {searchQuery ? (
              filteredUsers.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No users found
                </Typography>
              ) : (
                filteredUsers.map((u) => (
                  <React.Fragment key={u.id}>
                    <ListItem disablePadding>
                      <ListItemButton onClick={() => handleStartChat(u.id)}>
                        <ListItemAvatar>
                          <Avatar><AccountCircle /></Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={u.name} secondary="Start new chat" />
                      </ListItemButton>
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))
              )
            ) : (
              <>
                {threads.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                    No conversations yet
                  </Typography>
                )}
                {threads.map((thread) => (
                  <React.Fragment key={thread.id}>
                    <ListItem disablePadding>
                      <ListItemButton
                        selected={selectedThreadId === thread.id}
                        onClick={() => onSelectThread(thread.id)}
                      >
                        <ListItemAvatar>
                          <Avatar><AccountCircle /></Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={getThreadDisplayName(thread)}
                          secondary={
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {thread.messages.length > 0 ? thread.messages[thread.messages.length - 1].text : ''}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </>
            )}
          </List>
        </Box>

        {/* Right pane: Chat Dialog */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
          {!selectedThread ? (
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography color="text.secondary">Select a thread or search for a user to start chatting</Typography>
            </Box>
          ) : (
            <>
              {/* Chat Header */}
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {getThreadDisplayName(selectedThread)}
                </Typography>
              </Box>

              {/* Chat Messages */}
              <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {selectedThread.messages.map((msg) => {
                  const isMine = msg.senderId === currentUserId;
                  return (
                    <Box key={msg.id} sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1.5,
                          maxWidth: '70%',
                          bgcolor: isMine ? 'primary.main' : 'background.paper',
                          color: isMine ? 'primary.contrastText' : 'text.primary',
                          borderRadius: 2
                        }}
                      >
                        <Typography 
                          variant="body1"
                          sx={{
                            fontWeight: msg.format?.bold ? 'bold' : 'normal',
                            fontStyle: msg.format?.italic ? 'italic' : 'normal',
                            textDecoration: msg.format?.underline ? 'underline' : 'none',
                          }}
                        >
                          {msg.text}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5, opacity: 0.8 }}>
                          {format(new Date(msg.timestamp), 'HH:mm')}
                        </Typography>
                      </Paper>
                    </Box>
                  );
                })}
              </Box>

              {/* Chat Input */}
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <IconButton 
                    size="small" 
                    color={isBold ? 'primary' : 'default'}
                    onClick={() => setIsBold(!isBold)}
                  >
                    <FormatBold fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small"
                    color={isItalic ? 'primary' : 'default'}
                    onClick={() => setIsItalic(!isItalic)}
                  >
                    <FormatItalic fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small"
                    color={isUnderline ? 'primary' : 'default'}
                    onClick={() => setIsUnderline(!isUnderline)}
                  >
                    <FormatUnderlined fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontWeight: isBold ? 'bold' : 'normal',
                        fontStyle: isItalic ? 'italic' : 'normal',
                        textDecoration: isUnderline ? 'underline' : 'none',
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSend}
                    disabled={!messageText.trim()}
                    sx={{ minWidth: '48px', px: 2 }}
                  >
                    <Send />
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
