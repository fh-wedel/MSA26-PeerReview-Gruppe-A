import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  AccountCircle,
  Assignment,
  Brightness4,
  Brightness7,
  Close,
  Description,
  DoneAll,
  Mail,
  Menu as MenuIcon,
  Notifications,
  SettingsBrightness
} from '@mui/icons-material';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  streamNotifications,
  type Notification,
} from '../api/notification';
import { searchUsers } from '../api/communication';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import Logo from '../assets/Logo_Fachhochschule-Wedel.svg';
import { MessagesMenu } from './MessagesMenu';
import { NotificationMenu } from './NotificationMenu';

export const Navbar: React.FC = () => {
  const { themeMode, setThemeMode, mode } = useThemeContext();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorElTheme, setAnchorElTheme] = useState<null | HTMLElement>(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);
  const [anchorElMessages, setAnchorElMessages] = useState<null | HTMLElement>(null);
  const [anchorElProfile, setAnchorElProfile] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Local state for notifications and messages
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
      if (!isAuthenticated) return;
    searchUsers('')
      .then(users => {
        const map: Record<string, string> = {};
        users.forEach(u => map[u.id] = u.username);
        setUserMap(map);
      })
      .catch(err => console.error('Failed to load user map in navbar', err));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchNotifications()
      .then(setNotifications)
      .catch(err => console.error('Failed to load notifications', err));

    const controller = streamNotifications((n) => {
      setNotifications(prev =>
        prev.some(existing => existing.id === n.id) ? prev : [n, ...prev]
      );
    });

    return () => controller.abort();
  }, [isAuthenticated]);

  const { chats, unreadCount } = useChat();

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const handleMarkAllNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    markAllNotificationsRead().catch(err => console.error('Failed to mark all read', err));
  };

  const handleNotificationClick = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    setAnchorElNotifications(null);
    markNotificationRead(id).catch(err => console.error('Failed to mark read', err));
  };

  const handleMessageClick = () => {
    setAnchorElMessages(null);
    navigate('/chats');
  };

  const handleDrawerNav = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const userRoles = (user?.roles || []).map(r => r.toLowerCase());
  const hasSubmissionsAccess = userRoles.includes('admin') || userRoles.includes('examinationofficer') || userRoles.includes('author');
  const hasAdminOrReviewerRole = userRoles.includes('admin') || userRoles.includes('reviewer');

  // Build navigation items for reuse in both desktop and drawer
  const navItems: { label: string; path: string; show: boolean }[] = [
    { label: 'Home', path: '/dashboard', show: true },
    { label: 'Assignments', path: '/assignments', show: hasAdminOrReviewerRole },
    { label: 'Submissions', path: '/submissions', show: hasSubmissionsAccess },
    { label: 'Users', path: '/users', show: userRoles.includes('admin') || userRoles.includes('examinationofficer') },
    { label: 'Admin', path: '/admin', show: userRoles.includes('admin') },
  ];

  const isActivePath = (path: string) =>
    path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(path);

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 1, sm: 2 } }}>
        {/* Left Section: Hamburger (mobile) + Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {/* Hamburger menu for mobile */}
          {isMobile && isAuthenticated && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 1 }}
              aria-label="open navigation menu"
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}>
            <Box sx={{
              bgcolor: mode === 'dark' ? 'transparent' : 'white',
              p: 0.5,
              borderRadius: 1,
              display: 'flex',
              mr: { xs: 0, sm: 2 }
            }}>
              <img src={Logo} alt="FH Wedel Logo" style={{ height: '32px', filter: mode === 'dark' ? 'brightness(0) invert(1)' : 'none' }} />
            </Box>
            <Typography variant="h6" component="div" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Peer Review System
            </Typography>
          </Box>
        </Box>

        {/* Center Section: Navigation Links (desktop only) */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center', gap: 2 }}>
          {isAuthenticated && navItems.filter(item => item.show).map(item => (
            <Button
              key={item.path}
              color="inherit"
              onClick={() => navigate(item.path)}
              sx={{
                opacity: isActivePath(item.path) ? 1 : 0.7,
                fontSize: '1.15rem',
                fontWeight: isActivePath(item.path) ? 600 : 400
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        {/* Right Section: Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <IconButton sx={{ ml: { xs: 0.5, sm: 1 } }} onClick={(e) => setAnchorElTheme(e.currentTarget)} color="inherit">
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
              <MessagesMenu
                anchorEl={anchorElMessages}
                onClose={() => setAnchorElMessages(null)}
                chats={chats}
                userMap={userMap}
                mode={mode}
              />

              <IconButton color="inherit" onClick={(e) => setAnchorElNotifications(e.currentTarget)}>
                <Badge badgeContent={unreadNotifications} color="secondary">
                  <Notifications />
                </Badge>
              </IconButton>
              <NotificationMenu
                anchorEl={anchorElNotifications}
                onClose={() => setAnchorElNotifications(null)}
                notifications={notifications}
                unreadNotifications={unreadNotifications}
                handleMarkAllNotificationsRead={handleMarkAllNotificationsRead}
                handleNotificationClick={handleNotificationClick}
                mode={mode}
              />

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

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: { width: 260 }
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Navigation</Typography>
          <IconButton onClick={() => setDrawerOpen(false)} aria-label="close navigation menu">
            <Close />
          </IconButton>
        </Box>
        <Divider />
        <List>
          {navItems.filter(item => item.show).map(item => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={isActivePath(item.path)}
                onClick={() => handleDrawerNav(item.path)}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
    </AppBar>
  );
};
