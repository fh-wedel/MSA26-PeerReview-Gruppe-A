import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import { Assignment, Description, DoneAll } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  streamNotifications,
  type Notification
} from '../api/notification';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';

export const Notifications: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { mode } = useThemeContext();


  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    setLoading(true);
    fetchNotifications()
      .then(data => {
        setNotifications(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load notifications', err);
        setLoading(false);
      });

    const controller = streamNotifications((n) => {
      setNotifications(prev =>
        prev.some(existing => existing.id === n.id) ? prev : [n, ...prev]
      );
    });

    return () => controller.abort();
  }, [isAuthenticated]);

  const handleMarkAllRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleNotificationClick = async (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await markNotificationRead(id);
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const sortedNotifications = [...notifications].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const displayedNotifications = tabValue === 0 
    ? sortedNotifications 
    : sortedNotifications.filter(n => !n.read);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Notifications
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DoneAll />}
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
        >
          Mark all read
        </Button>
      </Box>

      <Paper sx={{ mb: 4, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`All (${notifications.length})`} />
          <Tab label={`Unread (${unreadCount})`} />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : displayedNotifications.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notifications found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tabValue === 1 ? "You have no unread notifications." : "You're all caught up!"}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {displayedNotifications.map((notif, index) => (
              <React.Fragment key={notif.id}>
                <ListItem disablePadding>
                  <ListItemButton
                    alignItems="flex-start"
                    onClick={() => handleNotificationClick(notif.id)}
                    sx={{
                      bgcolor: !notif.read ? (mode === 'dark' ? 'action.hover' : 'primary.50') : 'transparent',
                      px: 3,
                      py: 2,
                    }}
                  >
                    <ListItemAvatar sx={{ mt: 0.5 }}>
                      <Badge color="secondary" variant="dot" invisible={notif.read}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {notif.title.includes('Review') ? <Assignment /> : <Description />}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: !notif.read ? 'bold' : 'medium' }}>
                            {notif.title}
                          </Typography>
                          <Typography variant="caption" color={!notif.read ? 'text.primary' : 'text.secondary'} sx={{ fontWeight: !notif.read ? 'bold' : 'normal', ml: 2, flexShrink: 0 }}>
                            {formatDistanceToNow(new Date(notif.date), { addSuffix: true })}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          color={!notif.read ? 'text.primary' : 'text.secondary'}
                          sx={{ fontWeight: !notif.read ? 500 : 400 }}
                        >
                          {notif.message}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                {index < displayedNotifications.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};
