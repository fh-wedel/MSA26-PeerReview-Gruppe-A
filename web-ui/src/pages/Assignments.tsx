import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemButton, ListItemText, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { mockSubmissions } from '../stubs/submissions';
import { formatDateTime } from '../utils/date';
import { useAuth } from '../contexts/AuthContext';

export const Assignments: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentUserId = user?.id ?? 'current_user';
  const roles = (user?.roles || []).map(r => r.toLowerCase());
  
  const isAdminOrExaminer = roles.includes('admin') || roles.includes('examinationofficer');

  const myAssignments = isAdminOrExaminer 
    ? mockSubmissions 
    : mockSubmissions.filter(s => s.reviewerId === currentUserId);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Assignments
      </Typography>
      <Paper sx={{ mt: 3 }}>
        {myAssignments.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">You have no assignments at the moment.</Typography>
          </Box>
        ) : (
          <List>
            {myAssignments.map((assignment, index) => (
              <ListItem key={assignment.id} disablePadding divider={index < myAssignments.length - 1}>
                <ListItemButton onClick={() => navigate(`/assignments/${assignment.id}`)}>
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
                      primary={assignment.title}
                      secondary={`Submitted on: ${formatDateTime(assignment.createdAt, 'PPP')}`}
                    />
                    <Chip
                      label={assignment.status}
                      color={assignment.status === 'Published' ? 'success' : assignment.status === 'Under Review' ? 'warning' : 'default'}
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
