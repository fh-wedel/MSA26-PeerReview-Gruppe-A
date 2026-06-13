import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemButton, ListItemText, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../utils/date';
import { useAuth } from '../contexts/AuthContext';
import { useAssignments } from '../hooks/useAssignments';
import { StatusFilter, filterByStatus, sortByStatus } from '../components/StatusFilter';

export const Assignments: React.FC = () => {
  const navigate = useNavigate();
  const { assignments, loading, error } = useAssignments();
  const { user } = useAuth();
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
  const initialized = React.useRef(false);

  React.useEffect(() => {
    if (assignments.length > 0 && !initialized.current) {
      setSelectedStatuses(['Assigned']);
      initialized.current = true;
    }
  }, [assignments]);

  const roles = (user?.roles || []).map(r => r.toLowerCase());
  const hasAccess = roles.includes('admin') || roles.includes('reviewer');

  if (!hasAccess) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          My Assignments
        </Typography>
        <Alert severity="error">
          You are not authorized to view this page. This area is restricted to Administrators and Reviewers.
        </Alert>
      </Box>
    );
  }

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

  const enrichedAssignments = assignments.map(a => ({ ...a, status: 'Assigned' }));
  const availableStatuses = Array.from(new Set(enrichedAssignments.map(a => a.status))).sort();
  const finalAssignments = sortByStatus(filterByStatus(enrichedAssignments, selectedStatuses));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Assignments
      </Typography>
      <StatusFilter 
        availableStatuses={availableStatuses}
        selectedStatuses={selectedStatuses}
        onChange={setSelectedStatuses}
      />
      <Paper>
        {finalAssignments.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">
              {assignments.length === 0 ? "You have no assignments at the moment." : "No assignments found matching the criteria."}
            </Typography>
          </Box>
        ) : (
          <List>
            {finalAssignments.map((assignment, index) => (
              <ListItem key={assignment.submissionId} disablePadding divider={index < finalAssignments.length - 1}>
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
