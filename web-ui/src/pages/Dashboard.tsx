import React, { useState } from 'react';
import { Box, Typography, Button, Paper, List, ListItem, ListItemText, Snackbar, Alert } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickerDay } from '@mui/x-date-pickers';
import type { PickerDayProps } from '@mui/x-date-pickers';
import { Badge } from '@mui/material';
import { mockDeadlines } from '../stubs/deadlines';
import { SubmissionModal } from '../components/SubmissionModal';
import { useAuth } from '../contexts/AuthContext';
import { isSameDay } from 'date-fns';

function ServerDay(props: PickerDayProps & { highlightedDays?: Date[] }) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;
  const isSelected = !outsideCurrentMonth && highlightedDays.some((d: Date) => isSameDay(d, day));

  return (
    <Badge key={day.toString()} overlap="circular" badgeContent={isSelected ? '📅' : undefined}>
      <PickerDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
    </Badge>
  );
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const deadlineDates = mockDeadlines.map((d) => d.date);

  const handleSubmission = (title: string, reviewMode: string) => {
    console.log('Submitted:', { title, reviewMode });
    setSnackbarOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Welcome, {user?.name}</Typography>
        <Button variant="contained" color="primary" size="large" onClick={() => setModalOpen(true)}>
          Submit Paper for Review
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        <Box sx={{ flex: 2 }}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Your Active Assignments
            </Typography>
            <List>
              {mockDeadlines.map((deadline) => (
                <ListItem key={deadline.id} divider>
                  <ListItemText
                    primary={deadline.title}
                    secondary={`Due: ${deadline.date.toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
        
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Deadlines
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateCalendar
                slots={{ day: ServerDay }}
                slotProps={{
                  day: { highlightedDays: deadlineDates } as any,
                }}
              />
            </LocalizationProvider>
          </Paper>
        </Box>
      </Box>

      <SubmissionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmission}
        authorName={user?.name ?? ''}
      />
      
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          Paper submitted successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};
