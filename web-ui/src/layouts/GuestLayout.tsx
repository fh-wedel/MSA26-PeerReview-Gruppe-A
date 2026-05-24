import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const GuestLayout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container component="main" maxWidth="md" sx={{ mt: 8, mb: 2, flex: 1 }}>
        <Outlet />
      </Container>
      <Footer />
    </Box>
  );
};
