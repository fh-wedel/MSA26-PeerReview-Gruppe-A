import React from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Menu,
  Typography
} from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface MessagesMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  chats: any[];
  userMap: Record<string, string>;
  mode: string;
}

export const MessagesMenu: React.FC<MessagesMenuProps> = ({ anchorEl, onClose, chats, userMap, mode }) => {
  const navigate = useNavigate();
  const displayMessages = [...chats].slice(0, 5);

  const handleMessageClick = () => {
    onClose();
    navigate('/chats');
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: 280, sm: 320 },
            maxHeight: 400,
            display: 'flex',
            flexDirection: 'column'
          }
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Messages</Typography>
      </Box>
      <List sx={{ p: 0, flexGrow: 1, overflowY: 'auto' }}>
        {displayMessages.length === 0 ? (
          <ListItem>
            <ListItemText primary="No messages" sx={{ textAlign: 'center', color: 'text.secondary' }} />
          </ListItem>
        ) : (
          displayMessages.map((msg, index) => (
            <React.Fragment key={msg.chatId}>
              <ListItem disablePadding>
                <ListItemButton alignItems="flex-start" onClick={handleMessageClick} sx={{ bgcolor: 'transparent' }}>
                  <ListItemAvatar>
                    <Avatar><AccountCircle /></Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2">
                          {msg.chatType === 'SUBMISSION'
                            ? `Submission: ${msg.submissionId?.slice(0, 8)}...`
                            : (msg.otherParticipantId ? (userMap[msg.otherParticipantId] || msg.otherParticipantId) : 'Unknown')}
                        </Typography>
                        <Typography variant="caption" color={'text.secondary'}>
                          {msg.lastMessageAt ? formatDistanceToNow(new Date(msg.lastMessageAt), { addSuffix: true }) : ''}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color={'text.secondary'} noWrap>
                        {msg.chatType === 'SUBMISSION' ? 'Submission Chat' : 'General Chat'}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
              {index < displayMessages.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))
        )}
      </List>
      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
        <Button fullWidth onClick={handleMessageClick} sx={{
          textTransform: 'none',
          fontWeight: 'bold',
          color: mode === 'dark' ? 'primary.light' : 'primary.main'
        }}>
          View All Messages
        </Button>
      </Box>
    </Menu>
  );
};
