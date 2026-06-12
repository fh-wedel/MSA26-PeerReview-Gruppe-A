import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Box, Typography } from '@mui/material';
import type { AlertColor } from '@mui/material';

interface Notification {
  message: string;
  source?: string;
  severity: AlertColor;
}

interface NotificationContextType {
  showError: (message: string, source?: string) => void;
  showSuccess: (message: string, source?: string) => void;
  showWarning: (message: string, source?: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  showError: () => {},
  showSuccess: () => {},
  showWarning: () => {},
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [open, setOpen] = useState(false);

  const show = useCallback((message: string, severity: AlertColor, source?: string) => {
    setNotification({ message, severity, source });
    setOpen(true);
  }, []);

  const showError = useCallback(
    (message: string, source?: string) => show(message, 'error', source),
    [show],
  );
  const showSuccess = useCallback(
    (message: string, source?: string) => show(message, 'success', source),
    [show],
  );
  const showWarning = useCallback(
    (message: string, source?: string) => show(message, 'warning', source),
    [show],
  );

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <NotificationContext.Provider value={{ showError, showSuccess, showWarning }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClose}
          severity={notification?.severity ?? 'error'}
          variant="filled"
          sx={{ width: '100%', maxWidth: 520 }}
        >
          {notification?.source && (
            <Box component="span" sx={{ display: 'block' }}>
              <Typography
                component="span"
                variant="caption"
                sx={{
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  opacity: 0.85,
                  mr: 0.5,
                }}
              >
                [{notification.source}]
              </Typography>
            </Box>
          )}
          {notification?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
