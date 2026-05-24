import React, { useState } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemButton, ListItemText, Chip, FormControlLabel, Switch, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { mockSubmissions } from '../stubs/submissions';
import { formatDateTime } from '../utils/date';
import { useAuth } from '../contexts/AuthContext';

export const Submissions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unassignedOnly, setUnassignedOnly] = useState(false);

  const roles = (user?.roles || []).map(r => r.toLowerCase());
  const hasAccess = roles.includes('admin') || roles.includes('examinationofficer');

  if (!hasAccess) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Submissions
        </Typography>
        <Alert severity="error">
          You are not authorized to view this page. This area is restricted to Administrators and Examination Officers.
        </Alert>
      </Box>
    );
  }

  const currentUserId = user?.id ?? 'current_user';
  const mySubmissions = mockSubmissions.filter((s) => s.authorId === currentUserId);

  const displayedSubmissions = mockSubmissions.filter((s) => {
    if (unassignedOnly) {
      return !s.reviewerId;
    }
    return true;
  });

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Submissions
        </Typography>
        <Paper>
          {mySubmissions.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography color="text.secondary">You have no submissions.</Typography>
            </Box>
          ) : (
            <List>
              {mySubmissions.map((submission, index) => (
                <ListItem key={submission.id} disablePadding divider={index < mySubmissions.length - 1}>
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Submissions Overview
        </Typography>
      </Box>
      
      <Paper sx={{ mb: 3, p: 2 }}>
        <FormControlLabel
          control={<Switch checked={unassignedOnly} onChange={(e) => setUnassignedOnly(e.target.checked)} />}
          label="Only without reviewer assigned"
        />
      </Paper>

      <Paper>
        {displayedSubmissions.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">No submissions found matching the criteria.</Typography>
          </Box>
        ) : (
          <List>
            {displayedSubmissions.map((submission, index) => (
              <ListItem key={submission.id} disablePadding divider={index < displayedSubmissions.length - 1}>
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
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {!submission.reviewerId && (
                        <Chip label="Needs Reviewer" color="error" size="small" variant="outlined" />
                      )}
                      <Chip
                        label={submission.status}
                        color={submission.status === 'Published' ? 'success' : submission.status === 'Under Review' ? 'warning' : 'default'}
                        size="small"
                      />
                    </Box>
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
