import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Paper
} from '@mui/material';
import { Close, Send, FormatBold, FormatItalic, FormatUnderlined } from '@mui/icons-material';
import type { ChatThread } from '../stubs/chats';
import { format } from 'date-fns';

interface ChatModalProps {
  open: boolean;
  onClose: () => void;
  thread: ChatThread | undefined;
  currentUserId: string;
  onSendMessage: (text: string, msgFormat?: { bold?: boolean; italic?: boolean; underline?: boolean }) => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  open,
  onClose,
  thread,
  currentUserId,
  onSendMessage
}) => {
  const [messageText, setMessageText] = useState('');
  
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const handleSend = () => {
    if (messageText.trim()) {
      onSendMessage(messageText, {
        bold: isBold,
        italic: isItalic,
        underline: isUnderline
      });
      setMessageText('');
    }
  };

  const getThreadDisplayName = (thread: ChatThread) => {
    return thread.participants
      .filter(p => p.id !== currentUserId)
      .map(p => p.username)
      .join(', ') || 'Chat';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { height: '70vh' } }}>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{thread ? getThreadDisplayName(thread) : 'Chat'}</Typography>
        <IconButton onClick={onClose} aria-label="close">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', p: 0, flexDirection: 'column', bgcolor: 'background.default' }}>
        {/* Chat Messages */}
        <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {!thread || thread.messages.length === 0 ? (
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography color="text.secondary">No messages yet. Start the conversation!</Typography>
            </Box>
          ) : (
            thread.messages.map((msg) => {
              const isMine = msg.senderId === currentUserId;
              return (
                <Box key={msg.id} sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1.5,
                      maxWidth: '80%',
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
            })
          )}
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
      </DialogContent>
    </Dialog>
  );
};
