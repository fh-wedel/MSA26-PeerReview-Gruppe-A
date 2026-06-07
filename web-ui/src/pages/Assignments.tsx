import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemButton, ListItemText, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../utils/date';
import { useAssignments } from '../hooks/useAssignments';

export const Assignments: React.FC = () => {
  const navigate = useNavigate();
  const { assignments, loading, error } = useAssignments();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error.message}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Assignments
      </Typography>
      <Paper sx={{ mt: 3 }}>
        {assignments.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">You have no assignments at the moment.</Typography>
          </Box>
        ) : (
          <List>
            {assignments.map((assignment, index) => (
              <ListItem key={assignment.submissionId} disablePadding divider={index < assignments.length - 1}>
                <ListItemButton onClick={() => navigate(`/assignments/${assignment.submissionId}`)}>
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
                      primary={`Submission ID: ${assignment.submissionId}`}
                      secondary={`Assigned on: ${formatDateTime(assignment.assignedAt, 'PPP')}`}
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
