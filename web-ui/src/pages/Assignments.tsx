import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemButton, ListItemText, Chip } from '@mui/material';

const mockAssignments = [
  {
    id: 'assignment-1',
    title: 'Review: Architecture Patterns in Microservices',
    dateText: 'Due: Oct 20, 2023',
    statusLabel: 'Pending',
    statusColor: 'error' as const,
    actionLabel: 'Start Review',
    actionColor: 'default' as const,
  },
  {
    id: 'assignment-2',
    title: 'Review: Serverless Computing Benefits',
    dateText: 'Completed: Oct 01, 2023',
    statusLabel: 'Completed',
    statusColor: 'success' as const,
    actionLabel: 'View Feedback',
    actionColor: 'default' as const,
  },
];

export const Assignments: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Assignments
      </Typography>
      <Paper sx={{ mt: 3 }}>
        <List>
          {mockAssignments.map((assignment, index) => (
            <ListItem key={assignment.id} disablePadding divider={index < mockAssignments.length - 1}>
              <ListItemButton>
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
                  <Box>
                    <ListItemText primary={assignment.title} secondary={assignment.dateText} />
                    <Chip label={assignment.statusLabel} color={assignment.statusColor} size="small" sx={{ mt: 1 }} />
                  </Box>
                  <Chip label={assignment.actionLabel} color={assignment.actionColor} size="small" variant="outlined" />
                </Box>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};
