import React, {useEffect, useState} from 'react';
import {
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
  Skeleton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import {ArrowBack, Chat as ChatIcon, PictureAsPdf} from '@mui/icons-material';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import {useTheme} from '@mui/material/styles';

import {useAuth} from '../contexts/AuthContext';
import {fetchSubmissionMatch, fetchWorkflowRulesForSubmission} from '../api/communication';
import {configApiClient} from '../api/clients';
import {getMockSubmissionById} from '../stubs/submissions';
import {formatDateTime} from '../utils/date';
import {useWorkflowPlugins} from '../hooks/useWorkflowPlugins';
import {useUserResolver} from '../hooks/useUserResolver';

export const SubmissionDetails: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { submissionId } = useParams();
  const {plugins} = useWorkflowPlugins();
  const {resolveUserId} = useUserResolver();

  const isAssignmentsPage = location.pathname.startsWith('/assignments');
  const backTarget = isAssignmentsPage ? '/assignments' : '/submissions';
  const backText = isAssignmentsPage ? 'Back to Assignments' : 'Back to Submissions';

  const [chatAllowed, setChatAllowed] = useState(true);
  const [loadingContext, setLoadingContext] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submissionConfig, setSubmissionConfig] = useState<any>(null);
  const [submissionMatch, setSubmissionMatch] = useState<any>(null);
  const [workflowRules, setWorkflowRules] = useState<any>(null);

  const { user } = useAuth();

  const mockSubmission = submissionId ? getMockSubmissionById(submissionId) : undefined;

  useEffect(() => {
    if (!submissionId || !user) return;
    
    setLoadingContext(true);
    Promise.all([
      fetchSubmissionMatch(submissionId).catch(() => null),
      fetchWorkflowRulesForSubmission(submissionId).catch(() => null),
      configApiClient.submissionId.getSubmissionId(submissionId, { format: 'json' }).catch(() => null)
    ]).then(([match, fetchedRules, configRes]) => {
      setSubmissionMatch(match);
      setWorkflowRules(fetchedRules);
      if (configRes && (configRes as any).data) {
        setSubmissionConfig((configRes as any).data);
      }

      if (match && fetchedRules) {
        const isAuthor = match.submitterId === user.id;
        const isReviewer = match.matches.some((m: any) => m.examinerId === user.id);
        setChatAllowed(fetchedRules.authorReviewerChatAllowed && (isAuthor || isReviewer));
      } else {
        setChatAllowed(false);
      }
      setLoadingContext(false);
    });
  }, [submissionId, user]);

  if (loadingContext) {
    return (
      <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
        <Box sx={{flexGrow: 1, overflowY: 'auto'}}>
          <Skeleton variant="rectangular" width={220} height={36} sx={{ mb: 2, borderRadius: 1 }} />
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              <Box sx={{ flex: 1, width: '100%' }}>
                <Skeleton variant="text" width="60%" height={60} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" width={100} height={32} sx={{ mb: 3, borderRadius: 16 }} />
                <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', md: '1fr 1fr'}, gap: 3}}>
                  <Box>
                    <Skeleton variant="text" width={80} height={24} />
                    <Skeleton variant="text" width={120} height={32} />
                  </Box>
                  <Box>
                    <Skeleton variant="text" width={80} height={24} />
                    <Skeleton variant="text" width={120} height={32} />
                  </Box>
                  <Box>
                    <Skeleton variant="text" width={80} height={24} />
                    <Skeleton variant="text" width={120} height={32} />
                  </Box>
                  <Box>
                    <Skeleton variant="text" width={80} height={24} />
                    <Skeleton variant="text" width={120} height={32} />
                  </Box>
                </Box>
              </Box>
              <Stack spacing={1.5} sx={{ minWidth: { md: 260 }, width: { xs: '100%', md: 'auto' } }}>
                <Skeleton variant="rectangular" height={42} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" height={42} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" height={42} sx={{ borderRadius: 1 }} />
                <Skeleton variant="text" width="100%" height={40} sx={{ mt: 1.5 }} />
                <Skeleton variant="text" width="100%" height={24} />
              </Stack>
            </Box>
          </Paper>
          <Paper sx={{ p: 3, mt: 3 }}>
            <Skeleton variant="text" width="20%" height={32} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={64} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={64} />
          </Paper>
        </Box>
      </Box>
    );
  }

  // Combine real API data with mock data as a fallback
  const reviewAvailable = mockSubmission ? Boolean(mockSubmission.review) : false;
  const documentAvailable = mockSubmission ? Boolean(mockSubmission.documentUrl) : false;
  const title = submissionConfig?.title || mockSubmission?.title || 'Untitled Submission';
  
  // Resolve status based on matching
  let status = 'Created';
  if (submissionMatch && submissionMatch.status === 'MATCHED') {
    status = isAssignmentsPage ? 'Assigned' : 'Matched';
  }
  const reviewMode = submissionConfig?.reviewProcessType || mockSubmission?.reviewMode || 'unknown';

  if (!submissionConfig?.createdAt) {
    throw new Error('Missing real creation date from backend.');
  }
  const createdAt = submissionConfig.createdAt;

  const redactedColor = theme.palette.mode === 'dark' ? '#424242' : '#9e9e9e';

  // Determine user context for smart anonymity
  const privilegedRoles = ['Admin', 'Teacher', 'ExaminationOfficer'];
  const isPrivileged = user?.roles?.some(r => privilegedRoles.includes(r)) ?? false;
  const authorIds: string[] = submissionConfig?.authorIds ?? (submissionMatch?.submitterId ? [submissionMatch.submitterId] : []);
  const isAuthor = !!user && authorIds.includes(user.id);

  const redactedNode = (tooltipText: string) => (
      <Tooltip title={tooltipText}>
        <Box component="span"
             sx={{backgroundColor: redactedColor, color: redactedColor, userSelect: 'none', px: 1, borderRadius: 1}}>
          [REDACTED]
        </Box>
      </Tooltip>
  );

  // Should author names be hidden from the current user?
  const shouldHideAuthors = workflowRules?.authorAnonymous && !isAuthor && !isPrivileged;

  // Build displayed author list
  const displayAuthors: React.ReactNode[] = shouldHideAuthors
      ? [redactedNode('Author is anonymous')]
      : authorIds.map((id: string) => {
        const name = id === submissionMatch?.submitterId
            ? (submissionMatch.submitterUsername || resolveUserId(id))
            : resolveUserId(id);
        return <Typography key={id}>{name}</Typography>;
      });
  if (displayAuthors.length === 0) {
    displayAuthors.push(<Typography key="unknown">Unknown</Typography>);
  }

  // Build displayed reviewer list
  const matches: any[] = submissionMatch?.matches ?? [];
  const displayReviewers: React.ReactNode[] = matches.length === 0
      ? [<Typography key="none" color="text.secondary">Not assigned yet</Typography>]
      : matches.map((m: any) => {
        // Per-reviewer anonymity: hide unless current user IS this reviewer or is privileged
        const hideThisReviewer = workflowRules?.reviewerAnonymous && m.examinerId !== user?.id && !isPrivileged;
        if (hideThisReviewer) {
          return <Box key={m.examinerId}>{redactedNode('Reviewer is anonymous')}</Box>;
        }
        return <Typography key={m.examinerId}>{m.examinerUsername}</Typography>;
      });

  // Dynamically build history based on API data
  const dynamicHistory: { id: string, label: string, changedAt: string, description?: string }[] = [];

  if (submissionConfig?.createdAt) {
    dynamicHistory.push({
      id: 'event-created',
      label: 'Submission Created',
      changedAt: submissionConfig.createdAt,
      description: 'The submission was created.'
    });
  }

  if (submissionMatch && submissionMatch.status === 'MATCHED' && submissionMatch.matchedAt) {
    const reviewerCount = submissionMatch.matches?.length || submissionMatch.numberOfExaminers || 0;
    dynamicHistory.push({
      id: 'event-matched',
      label: isAssignmentsPage ? 'Assignment Received' : 'Reviewers Assigned',
      changedAt: submissionMatch.matchedAt,
      description: isAssignmentsPage
          ? `You were assigned to review this submission.`
          : `${reviewerCount} reviewer${reviewerCount === 1 ? '' : 's'} assigned to the submission.`
    });
  }

  const historyToDisplay = dynamicHistory.length > 0 ? dynamicHistory : (mockSubmission?.history ? [...mockSubmission.history] : []);

  // Sort descending (latest first)
  historyToDisplay.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());

  return (
    <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
      <Box sx={{flexGrow: 1, overflowY: 'auto'}}>
        <Button
          variant={theme.palette.mode === 'dark' ? 'contained' : 'outlined'}
          color="primary"
          startIcon={<ArrowBack />}
          sx={{ mb: 2 }}
          onClick={() => navigate(backTarget)}
        >
          {backText}
        </Button>

        <Paper sx={{ p: 3, mb: 3 }}>
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
                {title}
              </Typography>
              <Chip
                label={status}
                color={status === 'Published' ? 'success' : (status === 'Matched' || status === 'Assigned') ? 'info' : 'default'}
                sx={{ mb: 3 }}
              />

              <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', md: '1fr 1fr'}, gap: 3}}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography>{formatDateTime(createdAt)}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Review Mode
                  </Typography>
                  <Typography sx={{ textTransform: 'capitalize' }}>
                    {plugins.find(p => p.name === reviewMode)?.title || reviewMode}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Authors
                  </Typography>
                  {displayAuthors}
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Reviewers
                  </Typography>
                  {displayReviewers}
                </Box>
              </Box>
            </Box>

            <Stack spacing={1.5} sx={{ minWidth: { md: 260 }, width: { xs: '100%', md: 'auto' } }}>
              <Button
                variant={theme.palette.mode === 'dark' ? 'contained' : 'outlined'}
                size="large"
                fullWidth
                startIcon={<PictureAsPdf />}
                href={mockSubmission?.documentUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
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

              <Tooltip title={!chatAllowed ? "Chat is disabled by the workflow rules" : ""}>
                  <span style={{width: '100%'}}>
                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        fullWidth
                        startIcon={<ChatIcon/>}
                        disabled={!chatAllowed}
                        onClick={() => navigate('/chats?tab=submissions')}
                    >
                      {isAssignmentsPage ? 'Assignment Chat' : 'Submission Chat'}
                    </Button>
                  </span>
              </Tooltip>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                {reviewAvailable
                  ? 'The completed review is available for this submission.'
                  : 'The review is not available yet. It will appear here once the evaluation is complete.'}
              </Typography>
            </Stack>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Status History
          </Typography>

          {historyToDisplay.length === 0 ? (
            <Typography color="text.secondary">No status updates yet.</Typography>
          ) : (
            <List>
              {historyToDisplay.map((entry, index) => (
                  <ListItem key={entry.id} divider={index < historyToDisplay.length - 1}>
                  <ListItemText
                    primary={entry.label}
                    secondary={`${formatDateTime(entry.changedAt)}${entry.description ? ` — ${entry.description}` : ''}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Review</DialogTitle>
        <DialogContent dividers>
          {mockSubmission?.review && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Decision
                </Typography>
                <Typography>{mockSubmission.review.decision}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Reviewed At
                </Typography>
                <Typography>{formatDateTime(mockSubmission.review.reviewedAt)}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Summary
                </Typography>
                <Typography>{mockSubmission.review.summary}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Strengths
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 3 }}>
                  {mockSubmission.review.strengths.map((strength, index) => (
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
                  {mockSubmission.review.improvements.map((improvement, index) => (
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
