import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

export const SubmissionDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAssignmentsPage = location.pathname.startsWith('/assignments');
  const backTarget = isAssignmentsPage ? '/assignments' : '/submissions';
  const backText = isAssignmentsPage ? 'Back to Assignments' : 'Back to Submissions';

  return (
    <Box>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<ArrowBack />}
        sx={{ mb: 2 }}
        onClick={() => navigate(backTarget)}
      >
        {backText}
      </Button>

      <Box>
        <Typography variant="h4" gutterBottom>
          Submission Details
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Submission details are not available yet because the submission service is not integrated.
        </Typography>
      </Box>
    </Box>
  );
};
