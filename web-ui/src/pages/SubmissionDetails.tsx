import React, { useState } from 'react';
import {
  Stack,
  Box,
  Snackbar,
  Alert,
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
  Autocomplete,
  TextField,
  Badge,
} from '@mui/material';
import { ArrowBack, PictureAsPdf, Chat as ChatIcon, Edit as EditIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { formatSubmissionReviewMode, getMockSubmissionById } from '../stubs/submissions';
import type { SubmissionReviewMode } from '../stubs/submissions';
import { mockUsers } from '../stubs/users';
import type { MockUser } from '../stubs/users';
import { formatDateTime } from '../utils/date';
import { useAuth } from '../contexts/AuthContext';
import { ChatModal } from '../components/ChatModal';
import { mockChatThreads } from '../stubs/chats';
import { mockMessages } from '../stubs/messages';
import { useSearchParams } from 'react-router-dom';

export const SubmissionDetails: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { submissionId } = useParams<{ submissionId: string }>();
  const { user } = useAuth();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [chatOpenState, setChatOpenState] = useState(false);
  const chatOpen = searchParams.get('chat') === 'true' || chatOpenState;

  const setChatOpen = setChatOpenState;
  const [chatThreads, setChatThreads] = useState(mockChatThreads);
  const [hasUnread, setHasUnread] = useState(() => {
    if (searchParams.get('chat') === 'true') return false;
    const initialThread = mockChatThreads.find(t => t.submissionId === submissionId);
    if (!initialThread) return false;
    return mockMessages.some(m => m.threadId === initialThread.id && m.unread);
  });

  const handleOpenChat = () => {
    setChatOpen(true);
    setHasUnread(false);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    if (searchParams.get('chat') === 'true') {
      searchParams.delete('chat');
      setSearchParams(searchParams);
    }
  };

  const thread = chatThreads.find(t => t.submissionId === submissionId);



  const isAssignmentsPage = location.pathname.startsWith('/assignments');
  const backTarget = isAssignmentsPage ? '/assignments' : '/submissions';
  const backText = isAssignmentsPage ? 'Back to Assignments' : 'Back to Submissions';

  const submission = submissionId ? getMockSubmissionById(submissionId) : undefined;

  const [author, setAuthor] = useState<MockUser | null>(
    submission ? mockUsers.find((u) => u.id === submission.authorId) || null : null
  );
  const [reviewer, setReviewer] = useState<MockUser | null>(
    submission ? mockUsers.find((u) => u.id === submission.reviewerId) || null : null
  );

  
  const [isEditing, setIsEditing] = useState(false);
  const [originalAuthor, setOriginalAuthor] = useState<MockUser | null>(author);
  const [originalReviewer, setOriginalReviewer] = useState<MockUser | null>(reviewer);

  const handleEdit = () => {
    setOriginalAuthor(author);
    setOriginalReviewer(reviewer);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setAuthor(originalAuthor);
    setReviewer(originalReviewer);
    setIsEditing(false);
  };

  const handleSave = () => {
    setIsEditing(false);
    showToast('Changes saved successfully');
  };

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const showToast = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };


  const handleSendMessage = React.useCallback((text: string, msgFormat?: { bold?: boolean; italic?: boolean; underline?: boolean }) => {
    const newMessage = {
      id: `m${Date.now()}`,
      senderId: user?.id ?? 'current_user',
      text,
      timestamp: new Date().toISOString(),
      format: msgFormat
    };
    
    setChatThreads(threads => {
      const existingThread = threads.find(t => t.submissionId === submissionId);
      if (existingThread) {
        return threads.map(t => t.id === existingThread.id ? { ...t, messages: [...t.messages, newMessage] } : t);
      } else {
        const participants = [{ id: user?.id ?? 'current_user', name: user?.name ?? 'Me' }];
        if (author && author.id !== user?.id) participants.push(author);
        if (reviewer && reviewer.id !== user?.id) participants.push(reviewer);
        
        const newThread = {
          id: `t${Date.now()}`,
          submissionId: submissionId,
          participants,
          messages: [newMessage]
        };
        return [...threads, newThread];
      }
    });
  }, [submissionId, user, author, reviewer]);

  if (!submission) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Submission not found
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          We could not find the submission you were looking for.
        </Typography>
        <Button variant="contained" onClick={() => navigate(backTarget)}>
          {backText}
        </Button>
      </Box>
    );
  }

  const isPrivileged =
    user?.roles?.some((role) => {
      const r = role.toLowerCase();
      return r === 'admin' || r === 'examinationofficer';
    }) ?? false;

  const getVisibleName = (id: string | undefined, name: string | undefined, mode: SubmissionReviewMode) => {
    if (isPrivileged) return name || 'Not assigned yet';
    if (mode === 'open review') return name || 'Not assigned yet';
    
    if (!id) return 'Not assigned yet';
    if (id === user?.id) return name;
    
    return 'Hidden due to blind review';
  };

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
        onClick={() => navigate(backTarget)}
      >
        {backText}
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

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 3, alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minHeight: 64 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created
                </Typography>
                <Typography sx={{ py: 1 }}>{formatDateTime(submission.createdAt)}</Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minHeight: 64 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Review Mode
                </Typography>
                <Typography sx={{ py: 1 }}>{formatSubmissionReviewMode(submission.reviewMode)}</Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minHeight: 64 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Current Status
                </Typography>
                <Typography sx={{ py: 1 }}>{submission.status}</Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minHeight: 64 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Author
                </Typography>
                
                {isPrivileged && isEditing ? (
                  <Autocomplete
                    options={mockUsers}
                    getOptionLabel={(option) => option.name}
                    value={author}
                    onChange={(_e, newValue) => {
                      setAuthor(newValue);
                    }}
                    renderInput={(params) => <TextField {...params} size="small" />}
                    sx={{ width: '100%' }}
                  />
                ) : (
                  <Typography sx={{ py: 1 }}>
                    {getVisibleName(author?.id || submission.authorId, author?.name || submission.authorName, submission.reviewMode)}
                  </Typography>
                )}

              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minHeight: 64 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Reviewer
                </Typography>
                
                {isPrivileged && isEditing ? (
                  <Autocomplete
                    options={mockUsers}
                    getOptionLabel={(option) => option.name}
                    value={reviewer}
                    onChange={(_e, newValue) => {
                      setReviewer(newValue);
                    }}
                    renderInput={(params) => <TextField {...params} size="small" />}
                    sx={{ width: '100%' }}
                  />
                ) : (
                  <Typography sx={{ py: 1 }}>
                    {getVisibleName(reviewer?.id || submission.reviewerId, reviewer?.name || submission.reviewerName, submission.reviewMode)}
                  </Typography>
                )}

              </Box>
            </Box>
          </Box>

          <Stack spacing={1.5} sx={{ minWidth: { md: 260 }, width: { xs: '100%', md: 'auto' } }}>
            {isPrivileged && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 1.5 }}>
                {isEditing ? (
                  <>
                    <Button onClick={handleCancel} color="inherit" size="small" startIcon={<CloseIcon />}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} color="primary" size="small" startIcon={<SaveIcon />}>
                      Save
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleEdit} color="primary" size="small" startIcon={<EditIcon />}>
                    Edit
                  </Button>
                )}
              </Box>
            )}
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
            <Button
              variant="contained"
              color="secondary"
              size="large"
              fullWidth
              startIcon={
                <Badge color="error" variant="dot" invisible={!hasUnread}>
                  <ChatIcon />
                </Badge>
              }
              onClick={handleOpenChat}
            >
              Open Chat
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

      <ChatModal
        open={chatOpen}
        onClose={handleCloseChat}
        thread={thread}
        currentUserId={user?.id ?? 'current_user'}
        onSendMessage={handleSendMessage}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 8 }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
