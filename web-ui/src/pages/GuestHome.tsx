import React from 'react';
import { Box, Typography, Button, Paper, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { School, AssignmentTurnedIn, Forum } from '@mui/icons-material';

export const GuestHome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <Paper elevation={0} sx={{ p: { xs: 4, md: 8 }, borderRadius: 4, bgcolor: 'primary.main', color: 'primary.contrastText', width: '100%', mb: 6 }}>
        <Typography variant="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Welcome to Peer Review
        </Typography>
        <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
          A collaborative platform for mutual peer review of scientific papers at FH Wedel.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" color="secondary" size="large" onClick={() => navigate('/login')} sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}>
            Sign In
          </Button>
          <Button variant="outlined" color="inherit" size="large" onClick={() => navigate('/register')} sx={{ px: 4, py: 1.5, fontSize: '1.1rem', borderColor: 'rgba(255,255,255,0.5)' }}>
            Register
          </Button>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, width: '100%' }}>
        <Box sx={{ flex: 1 }}>
          <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
            <School sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <CardContent>
              <Typography variant="h6" gutterBottom>Academic Excellence</Typography>
              <Typography color="text.secondary">Submit your papers and receive constructive feedback from your peers to improve your academic writing.</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
            <AssignmentTurnedIn sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
            <CardContent>
              <Typography variant="h6" gutterBottom>Structured Reviews</Typography>
              <Typography color="text.secondary">Participate in double-blind or open reviews with clear rubrics and deadlines managed by the system.</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
            <Forum sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <CardContent>
              <Typography variant="h6" gutterBottom>Direct Communication</Typography>
              <Typography color="text.secondary">Discuss feedback directly with reviewers or authors through our integrated messaging system.</Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};
