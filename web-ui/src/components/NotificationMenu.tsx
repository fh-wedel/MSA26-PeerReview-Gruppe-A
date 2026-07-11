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
import { Assignment, Description, DoneAll } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '../api/notification';

interface NotificationMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  notifications: Notification[];
  unreadNotifications: number;
  handleMarkAllNotificationsRead: () => void;
  handleNotificationClick: (id: string) => void;
  mode: string;
}

export const NotificationMenu: React.FC<NotificationMenuProps> = ({
  anchorEl,
  onClose,
  notifications,
  unreadNotifications,
  handleMarkAllNotificationsRead,
  handleNotificationClick,
  mode
}) => {
  const navigate = useNavigate();
  const displayNotifications = [...notifications]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

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
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Notifications</Typography>
        <Button
          size="small"
          onClick={handleMarkAllNotificationsRead}
          disabled={unreadNotifications === 0}
          startIcon={<DoneAll fontSize="small" />}
          sx={{ color: mode === 'dark' ? 'primary.light' : 'primary.main', fontWeight: 'bold' }}
        >
          Mark all read
        </Button>
      </Box>
      <List sx={{ p: 0, flexGrow: 1, overflowY: 'auto' }}>
        {displayNotifications.length === 0 ? (
          <ListItem>
            <ListItemText primary="No notifications" sx={{ textAlign: 'center', color: 'text.secondary' }} />
          </ListItem>
        ) : (
          displayNotifications.map((notif, index) => (
            <React.Fragment key={notif.id}>
              <ListItem disablePadding>
                <ListItemButton alignItems="flex-start" onClick={() => handleNotificationClick(notif.id)} sx={{ bgcolor: !notif.read ? 'action.hover' : 'transparent' }}>
                  <ListItemAvatar>
                    <Badge color="secondary" variant="dot" invisible={notif.read}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {notif.title.includes('Review') ? <Assignment /> : <Description />}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: !notif.read ? 'bold' : 'normal' }}>{notif.title}</Typography>
                        <Typography variant="caption" color={!notif.read ? 'text.primary' : 'text.secondary'} sx={{ fontWeight: !notif.read ? 'bold' : 'normal' }}>
                          {formatDistanceToNow(new Date(notif.date), { addSuffix: true })}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color={!notif.read ? 'text.primary' : 'text.secondary'} sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontWeight: !notif.read ? 500 : 400 }}>
                        {notif.message}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
              {index < displayNotifications.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))
        )}
      </List>
      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
        <Button fullWidth onClick={() => { onClose(); navigate('/notifications'); }} sx={{
          textTransform: 'none',
          fontWeight: 'bold',
          color: mode === 'dark' ? 'primary.light' : 'primary.main'
        }}>
          View All Notifications
        </Button>
      </Box>
    </Menu>
  );
};
