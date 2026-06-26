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
  Rating,
  Skeleton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import {ArrowBack, Chat as ChatIcon, PictureAsPdf, AutoAwesome as AutoAwesomeIcon} from '@mui/icons-material';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import {useTheme} from '@mui/material/styles';

import {useAuth} from '../contexts/AuthContext';
import {fetchSubmissionMatch, fetchWorkflowRulesForSubmission} from '../api/communication';
import {configApiClient, configurationApiClient, submissionApiClient, responseApiClient} from '../api/clients';
import {ReviewFormModal} from '../components/ReviewFormModal';
import {getMockSubmissionById} from '../stubs/submissions';
import {formatDateTime} from '../utils/date';
import {useWorkflowPlugins} from '../hooks/useWorkflowPlugins';
import {useUserResolver} from '../hooks/useUserResolver';
import {useNotification} from '../contexts/NotificationContext';

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
  const [reviewDialogOpenType, setReviewDialogOpenType] = useState<'human' | 'ai'>('human');
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
  const [reviewResults, setReviewResults] = useState<any[]>([]);
  const [reviewQuestions, setReviewQuestions] = useState<any[]>([]);

  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();

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
      configurationApiClient.submissions.getFeedbackFormForSubmission(submissionId).catch(() => null),
    ]).then(([match, fetchedRules, configRes, realSubRes, docsRes, reviewRes, formRes]) => {
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
      if (reviewRes && reviewRes.data) {
        setReviewResults(reviewRes.data);
      }
      if (formRes && (formRes as any).data) {
        setReviewQuestions((formRes as any).data);
      }

      if (match) {
        const isReviewer = isAssignmentsPage || (match.matches?.some((m: any) => m.examinerId === user.id) || false);
        setIsReviewerState(isReviewer);
      }
      
      if (match && fetchedRules) {
        const isAuthor = match.submitterIds?.includes(user.id);
        const isReviewer = isAssignmentsPage || (match.matches?.some((m: any) => m.examinerId === user.id) || false);
        setChatAllowed(fetchedRules.authorReviewerChatAllowed && (isAuthor || isReviewer));
      } else {
        setChatAllowed(false);
      }
      setLoadingContext(false);
    });

    // Polling for review results every 30s to reflect AI processing updates
    const pollInterval = setInterval(() => {
      responseApiClient.results.resultsDetail(submissionId).catch(() => null)
        .then(reviewRes => {
          if (reviewRes && reviewRes.data) {
            setReviewResults(reviewRes.data);
          }
        });
    }, 30000);

    return () => clearInterval(pollInterval);
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
  const isAiRequestedInConfig = realSubmission?.requestAiReview === true;
  const aiReviewResults = reviewResults.filter(r => r.isAiGenerated || r.aiStatus != null);
  const aiEverRequested = isAiRequestedInConfig || aiReviewResults.length > 0;
  
  const rawStatus = realSubmission?.status;
  
  const aiProcessing = aiReviewResults.some(r => r.aiStatus === 'PROCESSING' || r.aiStatus === 'REQUESTED') || 
                      (isAiRequestedInConfig && aiReviewResults.length === 0 && (rawStatus === 'SUBMITTED' || rawStatus === 'READY_FOR_REVIEW'));
  const aiFailed = aiReviewResults.some(r => r.aiStatus === 'FAILED');

  const completedReviews = reviewResults.filter(r => r.aiStatus === 'COMPLETED' || !r.isAiGenerated);
  const aiCompletedReviews = completedReviews.filter(r => r.isAiGenerated);
  const humanReviews = completedReviews.filter(r => !r.isAiGenerated);
  const aiCompleted = aiCompletedReviews.length > 0;

  const reviewAvailable = humanReviews.length > 0 || aiCompletedReviews.length > 0 || (mockSubmission ? Boolean(mockSubmission.review) : false);
  const currentUserHasReviewed = reviewResults.some(r => r.reviewerId === user?.id);
  const totalExpectedReviews = (submissionMatch?.matches?.length || submissionMatch?.numberOfExaminers || 0) + 
      (aiEverRequested ? 1 : 0);
  const documentAvailable = documents.length > 0;
  const title = submissionConfig?.title || mockSubmission?.title || 'Untitled Submission';
  
  // Resolve status based on realSubmission or matching
  let status = 'Created';
  if (realSubmission && realSubmission.status) {
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

  if (completedReviews.length > 0) {
    if (totalExpectedReviews > 0 && completedReviews.length < totalExpectedReviews) {
      status = `${completedReviews.length} / ${totalExpectedReviews} Reviews Completed`;
    } else {
      status = completedReviews.length > 1 ? 'All Reviews Completed' : 'Review Completed';
    }
  } else if (aiProcessing) {
    status = 'AI Review Processing';
  } else if (aiFailed) {
    status = 'AI Review Failed';
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
  completedReviews.forEach((review, idx) => {
    let label = 'Review Submitted';
    let description = 'A reviewer has submitted their evaluation.';
    if (review.isAiGenerated) {
       label = 'AI Review Completed';
       description = 'The AI reviewer has successfully submitted its evaluation.';
    }

    historyToDisplay.push({
      id: `event-reviewed-${review.id || idx}`,
      label: label,
      changedAt: review.completedAt || review.createdAt,
      description: description
    });
  });
  if (aiProcessing) {
    historyToDisplay.push({
      id: 'event-ai-processing',
      label: 'AI Review in Progress',
      changedAt: new Date().toISOString(),
      description: 'An AI reviewer is currently processing the submission. Results will be available shortly.'
    });
  }
  if (aiFailed) {
    historyToDisplay.push({
      id: 'event-ai-failed',
      label: 'AI Review Failed',
      changedAt: new Date().toISOString(),
      description: 'The AI reviewer failed to process the submission.'
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
      showError('Failed to download file.');
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!submissionId || !event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    if (file.type !== 'application/pdf') {
      showError('Only PDF files are allowed.');
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

      showSuccess('File uploaded successfully!');
    } catch (e) {
      console.error('Failed to upload file', e);
      showError('Failed to upload file.');
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
        showSuccess('Submission finalized successfully!');
      } catch (e) {
        console.error('Failed to submit', e);
        showError('Failed to finalize submission. Please ensure you have uploaded at least one document.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleTriggerAiReview = async () => {
    if (!submissionId) return;
    try {
      await responseApiClient.results.aiReviewCreate(submissionId);
      showSuccess('AI Review requested successfully!');
      // Refresh results
      const reviewRes = await responseApiClient.results.resultsDetail(submissionId);
      if (reviewRes.data) {
        setReviewResults(reviewRes.data);
      }
    } catch (e) {
      console.error('Failed to trigger AI review', e);
      showError('Failed to trigger AI review. It may have already been requested.');
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
              
              {aiEverRequested && (
                <Box sx={{ mt: 3, p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.08)' : 'rgba(25, 118, 210, 0.04)', borderRadius: 1, border: '1px solid', borderColor: 'primary.main' }}>
                  <Typography variant="subtitle2" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesomeIcon fontSize="small" /> AI Review Status
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {aiCompleted ? 'The AI review has been completed.' : aiFailed ? 'The AI review failed.' : 'The AI is currently processing this submission.'}
                  </Typography>
                </Box>
              )}
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

              {(rawStatus === 'SUBMITTED' || rawStatus === 'READY_FOR_REVIEW') && isReviewerState && !currentUserHasReviewed && (
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

              {(rawStatus === 'SUBMITTED' || rawStatus === 'READY_FOR_REVIEW') && !aiEverRequested && (isAuthor || isReviewerState) && (
                <Button
                  variant="outlined"
                  color="info"
                  size="large"
                  fullWidth
                  onClick={handleTriggerAiReview}
                  startIcon={<AutoAwesomeIcon />}
                >
                  Trigger AI Review
                </Button>
              )}

              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={humanReviews.length === 0 && !(mockSubmission ? Boolean(mockSubmission.review) : false)}
                onClick={() => { setReviewDialogOpenType('human'); setReviewOpen(true); }}
              >
                {humanReviews.length > 1 ? `View ${humanReviews.length} Reviews` : 'View Review'}
              </Button>

              {aiCompleted && (
                <Button
                  variant="contained"
                  color="info"
                  size="large"
                  fullWidth
                  onClick={() => { setReviewDialogOpenType('ai'); setReviewOpen(true); }}
                  startIcon={<AutoAwesomeIcon />}
                >
                  View Review from AI
                </Button>
              )}

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
                  ? (humanReviews.length + aiCompletedReviews.length > 1 
                      ? `${humanReviews.length + aiCompletedReviews.length} completed reviews are available for this submission.` 
                      : 'The completed review is available for this submission.')
                  : aiProcessing
                  ? 'The AI is currently analyzing the document. Please wait...'
                  : aiFailed
                  ? 'The AI encountered an error while reviewing.'
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
        <DialogTitle>{reviewDialogOpenType === 'ai' ? 'AI Review' : 'Reviews'}</DialogTitle>
        <DialogContent dividers>
          {(reviewDialogOpenType === 'ai' ? aiCompletedReviews : humanReviews).length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {(reviewDialogOpenType === 'ai' ? aiCompletedReviews : humanReviews).map((review: any, idx: number) => (
                <Box key={review.id || idx} sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 3, borderBottom: idx < (reviewDialogOpenType === 'ai' ? aiCompletedReviews : humanReviews).length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                  <Typography variant="h6">
                    Review {idx + 1} {review.isAiGenerated && <Chip label="AI Generated" color="primary" size="small" sx={{ ml: 1 }} />}
                  </Typography>
                  {review.finalGrade && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Final Grade
                      </Typography>
                      <Typography>{review.finalGrade}</Typography>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Reviewed At
                    </Typography>
                    <Typography>{formatDateTime(review.completedAt || review.createdAt)}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Overall Comments
                    </Typography>
                    <Typography sx={{ whiteSpace: 'pre-line' }}>{review.reviewComments}</Typography>
                  </Box>

                  {(() => {
                    const schemaToUse = reviewQuestions.length > 0 ? reviewQuestions : review.gradingSchema;
                    if (schemaToUse && schemaToUse.length > 0) {
                      return (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Detailed Assessment
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {schemaToUse.map((q: any, index: number) => {
                              const answerObj = review.answers?.find((a: any) => a.questionId === (q.id || q.questionId));
                              const displayAnswer = answerObj?.answer || q.answer || '';
                              return (
                                <Box key={q.id || index} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                                    {q.text}
                                  </Typography>
                                  {q.type === 'RATING' ? (
                                    <Rating value={parseFloat(displayAnswer) || 0} max={q.maxPoints || 5} readOnly />
                                  ) : q.type === 'SCALE' ? (
                                    <Typography variant="body2">{displayAnswer} / {q.maxPoints || 10}</Typography>
                                  ) : q.type === 'MULTIPLE_CHOICE' ? (
                                    <Chip label={displayAnswer || 'No answer'} size="small" />
                                  ) : (
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{displayAnswer || 'No answer'}</Typography>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>
                      );
                    } else if (review.answers && review.answers.length > 0) {
                      return (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Detailed Assessment
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {review.answers.map((answer: any, index: number) => (
                              <Box key={answer.questionId || index} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Question ID: {answer.questionId}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {answer.answer}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      );
                    }
                    return null;
                  })()}
                </Box>
              ))}
            </Box>
          ) : reviewDialogOpenType === 'human' && mockSubmission?.review ? (
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
            showSuccess("Review submitted successfully!");
            setReviewFormOpen(false);
            // Optionally reload the review data
            responseApiClient.results.resultsDetail(submissionId).then(res => {
              if (res && res.data) {
                setReviewResults(res.data);
              }
            }).catch(console.error);
          }}
        />
      )}
    </Box>
  );
};
