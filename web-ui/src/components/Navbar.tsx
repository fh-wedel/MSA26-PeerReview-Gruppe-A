import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Badge, Box, Menu, MenuItem, Button, List, ListItem, ListItemButton, ListItemAvatar, Avatar, ListItemText, Divider } from '@mui/material';
import { Brightness4, Brightness7, SettingsBrightness, Notifications, Mail, AccountCircle, Assignment, Description } from '@mui/icons-material';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { mockNotifications } from '../stubs/notifications';
import { mockMessages } from '../stubs/messages';
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

  const unreadNotifications = mockNotifications.filter((n) => !n.read).length;
  const unreadMessages = mockMessages.filter((m) => m.unread).length;

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
                sx={{ opacity: location.pathname === '/dashboard' ? 1 : 0.7, fontSize: '1.05rem' }}
              >
                Home
              </Button>
              <Button 
                color="inherit" 
                onClick={() => navigate('/submissions')}
                sx={{ opacity: location.pathname.startsWith('/submissions') ? 1 : 0.7, fontSize: '1.05rem' }}
              >
                My Submissions
              </Button>
              <Button 
                color="inherit" 
                onClick={() => navigate('/assignments')}
                sx={{ opacity: location.pathname === '/assignments' ? 1 : 0.7, fontSize: '1.05rem' }}
              >
                My Assignments
              </Button>
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
                <Badge badgeContent={unreadMessages} color="secondary">
                  <Mail />
                </Badge>
              </IconButton>
              <Menu
                anchorEl={anchorElMessages}
                open={Boolean(anchorElMessages)}
                onClose={() => setAnchorElMessages(null)}
                slotProps={{ paper: { sx: { width: 320, maxHeight: 400 } } }}
              >
                <List sx={{ p: 0 }}>
                  {mockMessages.map((msg, index) => (
                    <React.Fragment key={msg.id}>
                      <ListItem disablePadding>
                        <ListItemButton alignItems="flex-start" onClick={() => setAnchorElMessages(null)} sx={{ bgcolor: msg.unread ? 'action.hover' : 'transparent' }}>
                          <ListItemAvatar>
                            <Avatar><AccountCircle /></Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle2">{msg.sender}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {msg.preview}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                      {index < mockMessages.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
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
                slotProps={{ paper: { sx: { width: 320, maxHeight: 400 } } }}
              >
                <List sx={{ p: 0 }}>
                  {mockNotifications.map((notif, index) => (
                    <React.Fragment key={notif.id}>
                      <ListItem disablePadding>
                        <ListItemButton alignItems="flex-start" onClick={() => setAnchorElNotifications(null)} sx={{ bgcolor: !notif.read ? 'action.hover' : 'transparent' }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {notif.title.includes('Review') ? <Assignment /> : <Description />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle2">{notif.title}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDistanceToNow(new Date(notif.date), { addSuffix: true })}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {notif.message}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                      {index < mockNotifications.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
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
                  {user?.roles ? user.roles.map(r => r.charAt(0).toUpperCase() + r.slice(1).toLowerCase()).join(', ') : 'User'}: {user?.name}
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
