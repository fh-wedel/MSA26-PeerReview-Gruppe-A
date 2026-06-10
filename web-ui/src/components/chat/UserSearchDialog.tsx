import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, List, ListItem, ListItemText, ListItemAvatar, Avatar, CircularProgress, IconButton } from '@mui/material';
import { AccountCircle, Search as SearchIcon } from '@mui/icons-material';
import { searchUsers } from '../../api/communication';
import type { UserSummary } from '../../api/communication';

interface UserSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectUser: (user: UserSummary) => void;
}

export const UserSearchDialog: React.FC<UserSearchDialogProps> = ({ open, onClose, onSelectUser }) => {
  const [query, setQuery] = useState('');
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setQuery('');
      setLoading(true);
      searchUsers('')
        .then(users => setAllUsers(users))
        .catch(err => console.error('Failed to load users', err))
        .finally(() => setLoading(false));
    } else {
      setAllUsers([]);
      setQuery('');
    }
  }, [open]);

  const displayedUsers = allUsers.filter(u => 
    u.username.toLowerCase().includes(query.toLowerCase()) || 
    u.email.toLowerCase().includes(query.toLowerCase())
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
          slotProps={{
            input: {
              endAdornment: (
                <IconButton>
                  <SearchIcon />
                </IconButton>
              )
            }
          }}
        />
        {loading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}
        {!loading && displayedUsers.length > 0 && (
          <List sx={{ mt: 2 }}>
            {displayedUsers.map((user) => (
              <ListItem component="div" onClick={() => onSelectUser(user)} key={user.id} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                <ListItemAvatar>
                  <Avatar><AccountCircle /></Avatar>
                </ListItemAvatar>
                <ListItemText primary={user.username} secondary={user.email} />
              </ListItem>
            ))}
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

