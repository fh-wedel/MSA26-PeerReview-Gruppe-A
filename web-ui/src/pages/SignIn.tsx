import React, { useEffect } from 'react';
import { Box, Paper, Typography, Button, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoginIcon from '@mui/icons-material/Login';

export const SignIn: React.FC = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }

    if (!loading) {
      login();
    }
  }, [isAuthenticated, loading, login, navigate]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 3, textAlign: 'center' }}>
        <CircularProgress sx={{ mb: 3 }} />
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          Redirecting to Secure Login
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          We are redirecting you to the PeerReview Single Sign-On service...
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<LoginIcon />}
          onClick={() => login()}
          sx={{ px: 4, py: 1.5, borderRadius: 2 }}
        >
          Click here if not redirected
        </Button>
      </Paper>
    </Box>
  );
};
