import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Outlet />
      </Container>
    </Box>
  );
};
