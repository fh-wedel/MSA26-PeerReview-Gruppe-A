import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip, Button } from '@mui/material';

export const Assignments: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Assignments
      </Typography>
      <Paper sx={{ p: 3, mt: 3 }}>
        <List>
          <ListItem divider sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <ListItemText 
                primary="Review: Architecture Patterns in Microservices" 
                secondary="Due: Oct 20, 2023" 
              />
              <Chip label="Pending" color="error" size="small" sx={{ mt: 1 }} />
            </Box>
            <Button variant="outlined" size="small">Start Review</Button>
          </ListItem>
          <ListItem sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <ListItemText 
                primary="Review: Serverless Computing Benefits" 
                secondary="Completed: Oct 01, 2023" 
              />
              <Chip label="Completed" color="success" size="small" sx={{ mt: 1 }} />
            </Box>
            <Button variant="text" size="small">View Feedback</Button>
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};
