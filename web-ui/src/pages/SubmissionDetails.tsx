import React, {useEffect, useMemo, useState} from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import {ArrowBack, Chat as ChatIcon, Close as CloseIcon, PictureAsPdf} from '@mui/icons-material';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import {useTheme} from '@mui/material/styles';

import {ChatWidget} from '../components/chat/ChatWidget';
import {useAuth} from '../contexts/AuthContext';
import type {UserSummary} from '../api/communication';
import {fetchSubmissionMatch, fetchWorkflowRulesForSubmission} from '../api/communication';
import {useChat} from '../contexts/ChatContext';
import {configApiClient} from '../api/clients';
import {getMockSubmissionById} from '../stubs/submissions';
import {formatDateTime} from '../utils/date';
import {useWorkflowPlugins} from '../hooks/useWorkflowPlugins';

export const SubmissionDetails: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { submissionId } = useParams();
  const {plugins} = useWorkflowPlugins();

  const isAssignmentsPage = location.pathname.startsWith('/assignments');
  const backTarget = isAssignmentsPage ? '/assignments' : '/submissions';
  const backText = isAssignmentsPage ? 'Back to Assignments' : 'Back to Submissions';

  const [chatOpen, setChatOpen] = useState(new URLSearchParams(location.search).get('chat') === 'true');
  const [recipient, setRecipient] = useState<UserSummary | null>(null);
  const [chatAllowed, setChatAllowed] = useState(true);
  const [loadingContext, setLoadingContext] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submissionConfig, setSubmissionConfig] = useState<any>(null);
  const [submissionMatch, setSubmissionMatch] = useState<any>(null);
  const [workflowRules, setWorkflowRules] = useState<any>(null);

  const { user } = useAuth();
  const { chats } = useChat();

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
        if (!fetchedRules.authorReviewerChatAllowed) {
            setChatAllowed(false);
        } else {
            setChatAllowed(true);
        }

        const isAuthor = match.submitterId === user.id;
        const examinerMatch = match.matches.find((m: any) => m.examinerId === user.id);
        const isReviewer = !!examinerMatch;
        
        if (isAuthor && match.matches.length > 0) {
            const reviewer = match.matches[0];
            const reviewerDisplayName = fetchedRules.reviewerAnonymous
              ? `Reviewer for Assignment ${submissionId.slice(0, 8)}`
              : reviewer.examinerUsername;
              
            setRecipient({
                id: reviewer.examinerId,
                username: reviewerDisplayName
            });
        } else if (isReviewer) {
            const authorDisplayName = fetchedRules.authorAnonymous
              ? `Author of Assignment ${submissionId.slice(0, 8)}`
              : match.submitterUsername;

            setRecipient({
                id: match.submitterId,
                username: authorDisplayName
            });
        } else {
            setChatAllowed(false);
        }
      } else {
          setChatAllowed(false);
      }
      setLoadingContext(false);
    });
  }, [submissionId, user]);
  
  const existingChat = useMemo(() => {
      if (!submissionId || !recipient) return null;
      return chats.find(c => c.chatType === 'SUBMISSION' && c.submissionId === submissionId && c.otherParticipantId === recipient.id);
  }, [chats, submissionId, recipient]);

  if (loadingContext) {
    return (
      <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
        <Box sx={{ flexGrow: 1, pr: 0, overflowY: 'auto' }}>
          <Skeleton variant="rectangular" width={220} height={36} sx={{ mb: 2, borderRadius: 1 }} />
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              <Box sx={{ flex: 1, width: '100%' }}>
                <Skeleton variant="text" width="60%" height={60} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" width={100} height={32} sx={{ mb: 3, borderRadius: 16 }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ minWidth: 180 }}>
                    <Skeleton variant="text" width={80} height={24} />
                    <Skeleton variant="text" width={120} height={32} />
                  </Box>
                  <Box sx={{ minWidth: 180 }}>
                    <Skeleton variant="text" width={80} height={24} />
                    <Skeleton variant="text" width={120} height={32} />
                  </Box>
                  <Box sx={{ minWidth: 180 }}>
                    <Skeleton variant="text" width={80} height={24} />
                    <Skeleton variant="text" width={120} height={32} />
                  </Box>
                  <Box sx={{ minWidth: 180 }}>
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
      status = 'Matched';
  }
  const reviewMode = submissionConfig?.reviewProcessType || mockSubmission?.reviewMode || 'unknown';
  const createdAt = submissionConfig?.createdAt || mockSubmission?.createdAt || new Date().toISOString();

  const redactedColor = theme.palette.mode === 'dark' ? '#424242' : '#9e9e9e';

  // Determine displayed reviewer name
  let displayReviewerName: React.ReactNode = 'Not assigned yet';
  if (submissionMatch && submissionMatch.matches && submissionMatch.matches.length > 0) {
      if (workflowRules?.reviewerAnonymous) {
          displayReviewerName = (
              <Tooltip title="Reviewer is anonymous">
                  <Box component="span" sx={{ backgroundColor: redactedColor, color: redactedColor, userSelect: 'none', px: 1, borderRadius: 1 }}>
                      [REDACTED]
                  </Box>
              </Tooltip>
          );
      } else {
          displayReviewerName = submissionMatch.matches[0].examinerUsername;
      }
  }

  // Determine displayed author name
  let displayAuthorName: React.ReactNode = submissionMatch?.submitterUsername || 'Unknown';
  if (workflowRules?.authorAnonymous) {
      displayAuthorName = (
          <Tooltip title="Author is anonymous">
              <Box component="span" sx={{ backgroundColor: redactedColor, color: redactedColor, userSelect: 'none', px: 1, borderRadius: 1 }}>
                  [REDACTED]
              </Box>
          </Tooltip>
      );
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
      <Box sx={{ flexGrow: 1, pr: chatOpen && recipient ? 2 : 0, overflowY: 'auto' }}>
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
                color={status === 'Published' ? 'success' : status === 'Matched' ? 'info' : 'default'}
                sx={{ mb: 3 }}
              />

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ minWidth: 180 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography>{formatDateTime(createdAt)}</Typography>
                </Box>

                <Box sx={{ minWidth: 180 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Review Mode
                  </Typography>
                  <Typography sx={{ textTransform: 'capitalize' }}>
                    {plugins.find(p => p.name === reviewMode)?.title || reviewMode}
                  </Typography>
                </Box>

                <Box sx={{ minWidth: 180 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Author
                  </Typography>
                  <Typography>{displayAuthorName}</Typography>
                </Box>

                <Box sx={{ minWidth: 180 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Reviewer
                  </Typography>
                  <Typography>{displayReviewerName}</Typography>
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
              
              {!chatOpen && (
                <Tooltip title={!chatAllowed ? "Chat is disabled by the workflow rules" : ""}>
                    <span style={{ width: '100%' }}>
                      <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        fullWidth
                        startIcon={<ChatIcon />}
                        disabled={!chatAllowed || !recipient}
                        onClick={() => setChatOpen(true)}
                      >
                        Submission Chat
                      </Button>
                    </span>
                </Tooltip>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                {reviewAvailable
                  ? 'The completed review is available for this submission.'
                  : 'The review is not available yet. It will appear here once the evaluation is complete.'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {documentAvailable
                  ? `Opens ${mockSubmission?.documentName} in a new tab.`
                  : 'The uploaded PDF is not available right now.'}
              </Typography>
            </Stack>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Status History
          </Typography>

          {!mockSubmission || mockSubmission.history.length === 0 ? (
            <Typography color="text.secondary">No status updates yet.</Typography>
          ) : (
            <List>
              {mockSubmission.history.map((entry, index) => (
                <ListItem key={entry.id} divider={index < mockSubmission.history.length - 1}>
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

      {/* Chat Sidebar */}
      {chatOpen && recipient && (
        <Box sx={{ width: 400, borderLeft: 1, borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Chat with {recipient.username}</Typography>
            <IconButton onClick={() => setChatOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <ChatWidget 
              chatId={existingChat?.chatId}
              recipientId={recipient.id}
              displayName={recipient.username}
              chatType="SUBMISSION" 
              submissionId={submissionId!} 
            />
          </Box>
        </Box>
      )}

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
