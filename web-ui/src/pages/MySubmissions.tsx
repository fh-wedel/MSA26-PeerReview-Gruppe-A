import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemButton, ListItemText, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { mockSubmissions } from '../stubs/submissions';
import { formatDateTime } from '../utils/date';

export const MySubmissions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Submissions
      </Typography>
      <Paper sx={{ mt: 3 }}>
        {mockSubmissions.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">You have not created any submissions yet.</Typography>
          </Box>
        ) : (
          <List>
            {mockSubmissions.map((submission, index) => (
              <ListItem key={submission.id} disablePadding divider={index < mockSubmissions.length - 1}>
                <ListItemButton onClick={() => navigate(`/submissions/${submission.id}`)}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 2,
                      width: '100%',
                    }}
                  >
                    <ListItemText
                      primary={submission.title}
                      secondary={`Submitted on: ${formatDateTime(submission.createdAt, 'PPP')}`}
                    />
                    <Chip
                      label={submission.status}
                      color={submission.status === 'Published' ? 'success' : submission.status === 'Under Review' ? 'warning' : 'default'}
                      size="small"
                    />
                  </Box>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};
