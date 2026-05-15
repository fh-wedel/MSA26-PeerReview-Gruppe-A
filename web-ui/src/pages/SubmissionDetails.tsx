import React, { useState } from 'react';
import {
  Stack,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { ArrowBack, PictureAsPdf } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import { formatSubmissionReviewMode, getMockSubmissionById } from '../stubs/submissions';
import { formatDateTime } from '../utils/date';

export const SubmissionDetails: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { submissionId } = useParams<{ submissionId: string }>();
  const [reviewOpen, setReviewOpen] = useState(false);

  const submission = submissionId ? getMockSubmissionById(submissionId) : undefined;

  if (!submission) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Submission not found
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          We could not find the submission you were looking for.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/submissions')}>
          Back to My Submissions
        </Button>
      </Box>
    );
  }

  const reviewAvailable = Boolean(submission.review);
  const documentUrl = submission.documentUrl;
  const documentAvailable = Boolean(documentUrl);

  return (
    <Box>
      <Button
        variant={theme.palette.mode === 'dark' ? 'contained' : 'outlined'}
        color="primary"
        startIcon={<ArrowBack />}
        sx={{ mb: 2 }}
        onClick={() => navigate('/submissions')}
      >
        Back to My Submissions
      </Button>

      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" gutterBottom>
              {submission.title}
            </Typography>
            <Chip
              label={submission.status}
              color={submission.status === 'Published' ? 'success' : submission.status === 'Under Review' ? 'warning' : 'default'}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ minWidth: 180 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created
                </Typography>
                <Typography>{formatDateTime(submission.createdAt)}</Typography>
              </Box>

              <Box sx={{ minWidth: 180 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Review Mode
                </Typography>
                <Typography>{formatSubmissionReviewMode(submission.reviewMode)}</Typography>
              </Box>

              <Box sx={{ minWidth: 180 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Current Status
                </Typography>
                <Typography>{submission.status}</Typography>
              </Box>

              {submission.reviewMode === 'open review' && (
                <Box sx={{ minWidth: 180 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Reviewer
                  </Typography>
                  <Typography>{submission.reviewerName ?? 'Not assigned yet'}</Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Stack spacing={1.5} sx={{ minWidth: { md: 260 }, width: { xs: '100%', md: 'auto' } }}>
            <Button
              variant={theme.palette.mode === 'dark' ? 'contained' : 'outlined'}
              size="large"
              fullWidth
              startIcon={<PictureAsPdf />}
              {...(documentUrl
                ? {
                    href: documentUrl,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                  }
                : {})}
              disabled={!documentAvailable}
            >
              View Uploaded PDF
            </Button>

            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!reviewAvailable}
              onClick={() => setReviewOpen(true)}
            >
              View Review
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {reviewAvailable
                ? 'The completed review is available for this submission.'
                : 'The review is not available yet. It will appear here once the evaluation is complete.'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {documentAvailable
                ? `Opens ${submission.documentName} in a new tab.`
                : 'The uploaded PDF is not available right now.'}
            </Typography>
          </Stack>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Status History
        </Typography>

        {submission.history.length === 0 ? (
          <Typography color="text.secondary">No status updates yet.</Typography>
        ) : (
          <List>
            {submission.history.map((entry, index) => (
              <ListItem key={entry.id} divider={index < submission.history.length - 1}>
                <ListItemText
                  primary={entry.label}
                  secondary={`${formatDateTime(entry.changedAt)}${entry.description ? ` — ${entry.description}` : ''}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Review</DialogTitle>
        <DialogContent dividers>
          {submission.review && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Decision
                </Typography>
                <Typography>{submission.review.decision}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Reviewed At
                </Typography>
                <Typography>{formatDateTime(submission.review.reviewedAt)}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Summary
                </Typography>
                <Typography>{submission.review.summary}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Strengths
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 3 }}>
                  {submission.review.strengths.map((strength, index) => (
                    <Box component="li" key={`${strength}-${index}`} sx={{ mb: 0.5 }}>
                      <Typography>{strength}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Suggested Improvements
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 3 }}>
                  {submission.review.improvements.map((improvement, index) => (
                    <Box component="li" key={`${improvement}-${index}`} sx={{ mb: 0.5 }}>
                      <Typography>{improvement}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
