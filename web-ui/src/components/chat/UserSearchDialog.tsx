import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, List, ListItem, ListItemText, ListItemAvatar, Avatar, CircularProgress, Chip } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { searchUsers } from '../../api/communication';
import type { UserSummary, ChatSummary } from '../../api/communication';
import { useNotification } from '../../contexts/NotificationContext';

interface UserSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectUser: (user: UserSummary) => void;
  excludeUserId?: string;
  existingGeneralChats?: ChatSummary[];
}

export const UserSearchDialog: React.FC<UserSearchDialogProps> = ({ open, onClose, onSelectUser, excludeUserId, existingGeneralChats = [] }) => {
  const [query, setQuery] = useState('');
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const { showError } = useNotification();

  useEffect(() => {
    if (open) {
      setQuery('');
      setLoading(true);
      searchUsers('')
        .then(users => {
            if (excludeUserId) {
                setAllUsers(users.filter(u => u.id !== excludeUserId));
            } else {
                setAllUsers(users);
            }
        })
        .catch(err => showError(err instanceof Error ? err.message : 'Failed to load users.', 'Communication Service'))
        .finally(() => setLoading(false));
    } else {
      setAllUsers([]);
      setQuery('');
    }
  }, [open, excludeUserId]);

  const displayedUsers = allUsers.filter(u => 
    u.username.toLowerCase().includes(query.toLowerCase()) || 
    (u.email?.toLowerCase() ?? '').includes(query.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New Chat - Select User</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Search by name or email"
          type="text"
          fullWidth
          variant="outlined"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}
        {!loading && displayedUsers.length > 0 && (
          <List sx={{ mt: 2 }}>
            {displayedUsers.map((user) => {
              const hasExistingChat = existingGeneralChats.some(c => c.otherParticipantId === user.id);
              return (
                <ListItem 
                    component="div" 
                    onClick={() => onSelectUser(user)} 
                    key={user.id} 
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    secondaryAction={hasExistingChat && <Chip label="Chat exists" size="small" />}
                >
                  <ListItemAvatar>
                    <Avatar><AccountCircle /></Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={user.username} secondary={user.email ?? user.id} />
                </ListItem>
              );
            })}
          </List>
        )}
        {!loading && query && displayedUsers.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>No users found</div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
