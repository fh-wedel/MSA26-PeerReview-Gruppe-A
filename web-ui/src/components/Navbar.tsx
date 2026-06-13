import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Badge, Box, Menu, MenuItem, Button, List, ListItem, ListItemButton, ListItemAvatar, Avatar, ListItemText, Divider } from '@mui/material';
import { Brightness4, Brightness7, SettingsBrightness, Notifications, Mail, AccountCircle, Assignment, Description, DoneAll } from '@mui/icons-material';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { mockNotifications } from '../stubs/notifications';
import { searchUsers } from '../api/communication';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import Logo from '../assets/Logo_Fachhochschule-Wedel.svg';

export const Navbar: React.FC = () => {
  const { themeMode, setThemeMode, mode } = useThemeContext();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [anchorElTheme, setAnchorElTheme] = useState<null | HTMLElement>(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);
  const [anchorElMessages, setAnchorElMessages] = useState<null | HTMLElement>(null);
  const [anchorElProfile, setAnchorElProfile] = useState<null | HTMLElement>(null);

  // Local state for notifications and messages
  const [notifications, setNotifications] = useState(mockNotifications);
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    searchUsers('')
      .then(users => {
        const map: Record<string, string> = {};
        users.forEach(u => map[u.id] = u.username);
        setUserMap(map);
      })
      .catch(err => console.error('Failed to load user map in navbar', err));
  }, []);
  
  const { chats, unreadCount } = useChat();

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const displayMessages = [...chats].slice(0, 5);

  const displayNotifications = [...notifications]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const handleMarkAllNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    setAnchorElNotifications(null);
  };

  const handleMessageClick = () => {
    setAnchorElMessages(null);
    navigate('/chats');
  };



  const userRoles = (user?.roles || []).map(r => r.toLowerCase());
  const hasSubmissionsAccess = userRoles.includes('admin') || userRoles.includes('examinationofficer') || userRoles.includes('author');
  const hasAdminOrReviewerRole = userRoles.includes('admin') || userRoles.includes('reviewer');

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Left Section: Logo */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}>
            <Box sx={{ bgcolor: mode === 'dark' ? 'transparent' : 'white', p: 0.5, borderRadius: 1, display: 'flex', mr: 2 }}>
              <img src={Logo} alt="FH Wedel Logo" style={{ height: '32px', filter: mode === 'dark' ? 'brightness(0) invert(1)' : 'none' }} />
            </Box>
            <Typography variant="h6" component="div" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Peer Review System
            </Typography>
          </Box>
        </Box>

        {/* Center Section: Navigation Links */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
          {isAuthenticated && (
            <>
              <Button 
                color="inherit" 
                onClick={() => navigate('/dashboard')}
                sx={{ opacity: location.pathname === '/dashboard' ? 1 : 0.7, fontSize: '1.15rem', fontWeight: location.pathname === '/dashboard' ? 600 : 400 }}
              >
                Home
              </Button>
              {hasAdminOrReviewerRole && (
                <Button 
                  color="inherit" 
                  onClick={() => navigate('/assignments')}
                  sx={{ opacity: location.pathname.startsWith('/assignments') ? 1 : 0.7, fontSize: '1.15rem', fontWeight: location.pathname.startsWith('/assignments') ? 600 : 400 }}
                >
                  Assignments
                </Button>
              )}
              {hasSubmissionsAccess && (
                <Button 
                  color="inherit" 
                  onClick={() => navigate('/submissions')}
                  sx={{ opacity: location.pathname.startsWith('/submissions') ? 1 : 0.7, fontSize: '1.15rem', fontWeight: location.pathname.startsWith('/submissions') ? 600 : 400 }}
                >
                  Submissions
                </Button>
              )}
            </>
          )}
        </Box>

        {/* Right Section: Icons */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <IconButton sx={{ ml: 1 }} onClick={(e) => setAnchorElTheme(e.currentTarget)} color="inherit">
            {themeMode === 'system' ? <SettingsBrightness /> : themeMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          <Menu
            anchorEl={anchorElTheme}
            open={Boolean(anchorElTheme)}
            onClose={() => setAnchorElTheme(null)}
          >
            <MenuItem onClick={() => { setThemeMode('light'); setAnchorElTheme(null); }} selected={themeMode === 'light'}>
              Light
            </MenuItem>
            <MenuItem onClick={() => { setThemeMode('dark'); setAnchorElTheme(null); }} selected={themeMode === 'dark'}>
              Dark
            </MenuItem>
            <MenuItem onClick={() => { setThemeMode('system'); setAnchorElTheme(null); }} selected={themeMode === 'system'}>
              System
            </MenuItem>
          </Menu>

          {isAuthenticated ? (
            <>
              <IconButton color="inherit" onClick={(e) => setAnchorElMessages(e.currentTarget)}>
                <Badge badgeContent={unreadCount} color="secondary">
                  <Mail />
                </Badge>
              </IconButton>
              <Menu
                anchorEl={anchorElMessages}
                open={Boolean(anchorElMessages)}
                onClose={() => setAnchorElMessages(null)}
                slotProps={{ paper: { sx: { width: 320, maxHeight: 400, display: 'flex', flexDirection: 'column' } } }}
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
                                    <Typography variant="subtitle2">{userMap[msg.otherParticipantId] || msg.otherParticipantId}</Typography>
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
                  <Button fullWidth onClick={handleMessageClick} sx={{ textTransform: 'none', fontWeight: 'bold' }}>
                    View All Messages
                  </Button>
                </Box>
              </Menu>

              <IconButton color="inherit" onClick={(e) => setAnchorElNotifications(e.currentTarget)}>
                <Badge badgeContent={unreadNotifications} color="secondary">
                  <Notifications />
                </Badge>
              </IconButton>
              <Menu
                anchorEl={anchorElNotifications}
                open={Boolean(anchorElNotifications)}
                onClose={() => setAnchorElNotifications(null)}
                slotProps={{ paper: { sx: { width: 320, maxHeight: 400, display: 'flex', flexDirection: 'column' } } }}
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
              </Menu>

              <IconButton color="inherit" onClick={(e) => setAnchorElProfile(e.currentTarget)}>
                <AccountCircle />
              </IconButton>
              <Menu
                anchorEl={anchorElProfile}
                open={Boolean(anchorElProfile)}
                onClose={() => setAnchorElProfile(null)}
              >
                <MenuItem disabled>
                  {user?.roles ? user.roles.map(r => r.charAt(0).toUpperCase() + r.slice(1).toLowerCase()).join(', ') : 'User'}: {user?.username}
                </MenuItem>
                <MenuItem onClick={() => { setAnchorElProfile(null); logout(); navigate('/'); }}>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>Sign In</Button>
          )}
        </Box>
      </Toolbar>

    </AppBar>
  );
};
