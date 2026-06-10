import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, List, ListItem, ListItemText, ListItemAvatar, Avatar, CircularProgress, IconButton } from '@mui/material';
import { AccountCircle, Search as SearchIcon } from '@mui/icons-material';
import { searchUsers, UserSummary } from '../../api/communication';

interface UserSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectUser: (user: UserSummary) => void;
}

export const UserSearchDialog: React.FC<UserSearchDialogProps> = ({ open, onClose, onSelectUser }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const users = await searchUsers(query);
      setResults(users);
    } catch (err) {
      console.error('Failed to search users', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New Chat - Search User</DialogTitle>
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          InputProps={{
            endAdornment: (
              <IconButton onClick={handleSearch}>
                <SearchIcon />
              </IconButton>
            )
          }}
        />
        {loading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}
        {!loading && results.length > 0 && (
          <List sx={{ mt: 2 }}>
            {results.map((user) => (
              <ListItem component="div" onClick={() => onSelectUser(user)} key={user.id} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                <ListItemAvatar>
                  <Avatar><AccountCircle /></Avatar>
                </ListItemAvatar>
                <ListItemText primary={user.username} secondary={user.email} />
              </ListItem>
            ))}
          </List>
        )}
        {!loading && query && results.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>No users found</div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
