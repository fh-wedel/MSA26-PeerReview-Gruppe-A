import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';

export const MySubmissions: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Submissions
      </Typography>
      <Paper sx={{ p: 3, mt: 3 }}>
        <List>
          <ListItem divider>
            <ListItemText 
              primary="Event-Driven Systems in Modern Architecture" 
              secondary="Submitted on: Oct 12, 2023" 
            />
            <Chip label="Under Review" color="warning" size="small" />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Microfrontend Patterns" 
              secondary="Submitted on: Sep 05, 2023" 
            />
            <Chip label="Published" color="success" size="small" />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};
