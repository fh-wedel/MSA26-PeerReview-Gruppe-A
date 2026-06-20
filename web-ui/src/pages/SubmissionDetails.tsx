import React, {useEffect, useState} from 'react';
import {
  Alert,
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
import {configApiClient, submissionApiClient, responseApiClient} from '../api/clients';
import {ReviewFormModal} from '../components/ReviewFormModal';
import {getMockSubmissionById} from '../stubs/submissions';
import {formatDateTime} from '../utils/date';
import {useWorkflowPlugins} from '../hooks/useWorkflowPlugins';
import {useUserResolver} from '../hooks/useUserResolver';

export const SubmissionDetails: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { submissionId } = useParams();
  const {types} = useWorkflowPlugins();
  const {resolveUserId} = useUserResolver();

  const isAssignmentsPage = location.pathname.startsWith('/assignments');
  const backTarget = isAssignmentsPage ? '/assignments' : '/submissions';
  const backText = isAssignmentsPage ? 'Back to Assignments' : 'Back to Submissions';

  const [chatAllowed, setChatAllowed] = useState(true);
  const [loadingContext, setLoadingContext] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [isReviewerState, setIsReviewerState] = useState(false);
  const [submissionConfig, setSubmissionConfig] = useState<any>(null);
  const [submissionMatch, setSubmissionMatch] = useState<any>(null);
  const [workflowRules, setWorkflowRules] = useState<any>(null);
  const [realSubmission, setRealSubmission] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);

  const { user } = useAuth();

  const mockSubmission = submissionId ? getMockSubmissionById(submissionId) : undefined;

  useEffect(() => {
    if (!submissionId || !user) return;
    
    setLoadingContext(true);
    Promise.all([
      fetchSubmissionMatch(submissionId).catch(() => null),
      fetchWorkflowRulesForSubmission(submissionId).catch(() => null),
      configApiClient.submissions.submissionsDetail(submissionId, {format: 'json'}).catch(() => null),
      submissionApiClient.submissions.getSubmission(submissionId).catch(() => null),
      submissionApiClient.submissions.getDocuments(submissionId).catch(() => null),
      responseApiClient.results.resultsDetail(submissionId).catch(() => null),
    ]).then(([match, fetchedRules, configRes, realSubRes, docsRes, reviewRes]) => {
      setSubmissionMatch(match);
      setWorkflowRules(fetchedRules);
      if (configRes && (configRes as any).data) {
        setSubmissionConfig((configRes as any).data);
      }
      if (realSubRes && (realSubRes as any).data) {
        setRealSubmission((realSubRes as any).data);
      }
      if (docsRes && (docsRes as any).data) {
        setDocuments((docsRes as any).data);
      }
      if (reviewRes && (reviewRes as any).data) {
        setReviewResult((reviewRes as any).data);
      }

      if (match && fetchedRules) {
        const isAuthor = match.submitterIds?.includes(user.id);
        const isReviewer = match.matches.some((m: any) => m.examinerId === user.id);
        setIsReviewerState(isReviewer);
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
  const reviewAvailable = reviewResult ? true : (mockSubmission ? Boolean(mockSubmission.review) : false);
  const documentAvailable = documents.length > 0;
  const title = submissionConfig?.title || mockSubmission?.title || 'Untitled Submission';
  
  // Resolve status based on realSubmission or matching
  let status = 'Created';
  let rawStatus = undefined;
  if (realSubmission && realSubmission.status) {
    rawStatus = realSubmission.status;
    if (rawStatus === 'SUBMITTED') {
      status = 'Submitted';
    } else if (rawStatus === 'WAITING_FOR_SUBMISSION') {
      status = 'Waiting for Submission';
    } else if (rawStatus === 'READY_FOR_REVIEW') {
      status = 'Ready for Review';
    } else if (rawStatus === 'DRAFT') {
      status = 'Draft';
    } else {
      status = rawStatus;
    }
  } else if (submissionMatch && submissionMatch.status === 'MATCHED') {
    status = isAssignmentsPage ? 'Assigned' : 'Matched';
  } else if (submissionMatch && submissionMatch.status === 'FAILED') {
    status = 'Failed';
  }
  const reviewType = submissionConfig?.reviewProcessType || mockSubmission?.reviewType || 'unknown';

  if (!submissionConfig?.createdAt) {
    throw new Error('Missing real creation date from backend.');
  }
  const createdAt = submissionConfig.createdAt;

  const redactedColor = theme.palette.mode === 'dark' ? '#424242' : '#9e9e9e';

  // Determine user context for smart anonymity
  const privilegedRoles = ['Admin', 'Teacher', 'ExaminationOfficer'];
  const isPrivileged = user?.roles?.some(r => privilegedRoles.includes(r)) ?? false;
  const authorIds: string[] = submissionConfig?.authorIds ?? submissionMatch?.submitterIds ?? [];
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
        let name = resolveUserId(id);
        if (submissionMatch?.submitterIds && submissionMatch.submitterUsernames) {
          const index = submissionMatch.submitterIds.indexOf(id);
          if (index !== -1 && submissionMatch.submitterUsernames[index]) {
            name = submissionMatch.submitterUsernames[index];
          }
        }
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
  } else if (submissionMatch && submissionMatch.status === 'FAILED' && submissionMatch.matchedAt) {
    dynamicHistory.push({
      id: 'event-failed',
      label: 'Matching Failed',
      changedAt: submissionMatch.matchedAt,
      description: 'The automated matching process could not assign reviewers for this submission.'
    });
  }

  const historyToDisplay = [...dynamicHistory];
  if (realSubmission && realSubmission.submittedAt) {
    historyToDisplay.push({
      id: 'event-submitted',
      label: 'Submission Finalized',
      changedAt: realSubmission.submittedAt,
      description: 'The author finalized the document submission.'
    });
  }
  if (historyToDisplay.length === 0 && mockSubmission?.history) {
    historyToDisplay.push(...mockSubmission.history);
  }

  // Sort descending (latest first)
  historyToDisplay.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());

  // Upload/Submit Handlers

  const firstDoc = documents.length > 0 ? documents[0] : null;

  const handleDownload = async (docId: string) => {
    if (!submissionId) return;
    setDownloading(true);
    try {
      const res = await submissionApiClient.submissions.getPresignedDownloadUrl(submissionId, docId);
      if (res.data && res.data.uploadUrl) {
        window.open(res.data.uploadUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      console.error('Failed to get download URL', e);
      alert('Failed to download file.');
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!submissionId || !event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed.');
      return;
    }

    setUploading(true);
    try {
      // 1. Get presigned upload URL
      const urlRes = await submissionApiClient.submissions.getPresignedUploadUrl(submissionId, {
        fileName: file.name,
        contentType: file.type,
      });

      const { uploadUrl } = urlRes.data;
      if (!uploadUrl) throw new Error('No upload URL returned');

      // 2. Perform S3 PUT request
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error('S3 upload failed');
      }

      // 3. Reload documents list
      const docsRes = await submissionApiClient.submissions.getDocuments(submissionId);
      setDocuments(docsRes.data || []);
      
      // 4. Reload submission details
      const subRes = await submissionApiClient.submissions.getSubmission(submissionId);
      setRealSubmission(subRes.data);

      alert('File uploaded successfully!');
    } catch (e) {
      console.error('Failed to upload file', e);
      alert('Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!submissionId) return;
    if (window.confirm('Are you sure you want to finalize and submit? You will not be able to upload any more files.')) {
      setSubmitting(true);
      try {
        const res = await submissionApiClient.submissions.submitSubmission(submissionId);
        setRealSubmission(res.data);
        alert('Submission finalized successfully!');
      } catch (e) {
        console.error('Failed to submit', e);
        alert('Failed to finalize submission. Please ensure you have uploaded at least one document.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const isDraftOrWaiting = rawStatus === 'DRAFT' || rawStatus === 'WAITING_FOR_SUBMISSION';
  const showUploadArea = isAuthor && isDraftOrWaiting;

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
                color={status === 'Failed' ? 'error' : status === 'Published' ? 'success' : (status === 'Matched' || status === 'Assigned') ? 'info' : 'default'}
                sx={{ mb: 3 }}
              />

              {status === 'Failed' && (
                  <Alert severity="error" sx={{mb: 3}}>
                    The matching process failed for this submission. The workflow has ended early and no reviewers will
                    be assigned.
                  </Alert>
              )}

              {isPrivileged && (workflowRules?.authorAnonymous || workflowRules?.reviewerAnonymous) && (
                  <Alert severity="info" sx={{mb: 3}}>
                    As an Admin or Examination Officer, author and reviewer identities are visible to you, even if the
                    review mode normally hides them.
                  </Alert>
              )}

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
                      {types.find(p => p.name === reviewType)?.title || reviewType}
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
                onClick={() => firstDoc && handleDownload(firstDoc.documentId)}
                disabled={!documentAvailable || downloading}
              >
                {downloading ? 'Loading PDF...' : 'View Uploaded PDF'}
              </Button>

              {status === 'Submitted' && isReviewerState && !reviewAvailable && (
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  fullWidth
                  onClick={() => setReviewFormOpen(true)}
                >
                  Start Review
                </Button>
              )}

              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={!reviewAvailable}
                onClick={() => setReviewOpen(true)}
              >
                View Review
              </Button>

              <Tooltip
                  title={!chatAllowed ? (workflowRules?.authorReviewerChatAllowed ? "Only authors and reviewers can access this chat" : "Chat is disabled by the workflow rules") : ""}>
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

              {showUploadArea && (
                <Box sx={{ border: '1px dashed', borderColor: 'divider', p: 2, borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ mb: 1.5, wordBreak: 'break-all' }}>
                    {firstDoc ? `Current file: ${firstDoc.fileName}` : 'No PDF uploaded yet.'}
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    fullWidth
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : firstDoc ? 'Replace PDF' : 'Upload PDF'}
                    <input
                      type="file"
                      accept="application/pdf"
                      hidden
                      onChange={handleUpload}
                    />
                  </Button>
                </Box>
              )}

              {showUploadArea && firstDoc && (
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  fullWidth
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Finalize & Submit'}
                </Button>
              )}

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
          {reviewResult ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {reviewResult.finalGrade && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Final Grade
                  </Typography>
                  <Typography>{reviewResult.finalGrade}</Typography>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Reviewed At
                </Typography>
                <Typography>{formatDateTime(reviewResult.completedAt || reviewResult.createdAt)}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Overall Comments
                </Typography>
                <Typography sx={{ whiteSpace: 'pre-line' }}>{reviewResult.reviewComments}</Typography>
              </Box>

              {reviewResult.gradingSchema && reviewResult.gradingSchema.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Detailed Assessment
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 3 }}>
                    {reviewResult.gradingSchema.map((criterion: any, index: number) => (
                      <Box component="li" key={criterion.id || index} sx={{ mb: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{criterion.text}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Answer: {criterion.answer || 'N/A'} {criterion.maxPoints ? `/ ${criterion.maxPoints}` : ''}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          ) : mockSubmission?.review ? (
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
          ) : (
            <Typography>No review data available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {submissionId && (
        <ReviewFormModal
          open={reviewFormOpen}
          onClose={() => setReviewFormOpen(false)}
          submissionId={submissionId}
          onSubmitted={() => {
            alert("Review submitted successfully!");
            setReviewFormOpen(false);
            // Optionally reload the review data
            responseApiClient.results.resultsDetail(submissionId).then(res => {
              if (res && (res as any).data) {
                setReviewResult((res as any).data);
              }
            }).catch(console.error);
          }}
        />
      )}
    </Box>
  );
};
