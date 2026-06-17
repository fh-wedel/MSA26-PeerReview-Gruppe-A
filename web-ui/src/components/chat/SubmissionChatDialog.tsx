import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress, Alert, Autocomplete } from '@mui/material';
import { fetchSubmissionMatch, fetchWorkflowRulesForSubmission } from '../../api/communication';
import type { UserSummary } from '../../api/communication';
import { configApiClient } from '../../api/clients';
import { useAuth } from '../../contexts/AuthContext';
import { useAssignments } from '../../hooks/useAssignments';

interface SubmissionChatDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectUser: (user: UserSummary, submissionId: string) => void;
}

export const SubmissionChatDialog: React.FC<SubmissionChatDialogProps> = ({ open, onClose, onSelectUser }) => {
  const [submissionId, setSubmissionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authorSubmissions, setAuthorSubmissions] = useState<string[]>([]);
  const { user } = useAuth();
  const { assignments } = useAssignments();

  useEffect(() => {
    if (user?.id && open) {
      configApiClient.author.authorDetail(user.id, { format: 'json' })
        .then(res => {
          const configs = (res.data as Array<Record<string, unknown>>) || [];
          setAuthorSubmissions(configs.map(c => (c.id || c.submissionId) as string));
        })
        .catch(console.error);
    }
  }, [user?.id, open]);

  const handleCreate = async () => {
    if (!submissionId.trim()) {
      setError('Submission ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const match = await fetchSubmissionMatch(submissionId);
      const rules = await fetchWorkflowRulesForSubmission(submissionId);

      if (!rules.authorReviewerChatAllowed) {
        throw new Error('Chat is not allowed for this review type (Double Blind).');
      }

      if (!user) throw new Error('Not authenticated');

      const isAuthor = match.submitterId === user.id;
      const examinerMatch = match.matches.find(m => m.examinerId === user.id);
      const isReviewer = !!examinerMatch;

      if (!isAuthor && !isReviewer) {
        throw new Error('You are not a participant in this submission.');
      }

      let recipient: UserSummary;

      if (isAuthor) {
        if (match.matches.length === 0) {
          throw new Error('No reviewers have been assigned to this submission yet.');
        }
        // For simplicity, we just take the first reviewer. If there are multiple,
        // a more complex picker would be needed. 
        const reviewer = match.matches[0];
        
        const reviewerDisplayName = rules.reviewerAnonymous
          ? `Reviewer for Assignment ${submissionId.slice(0, 8)}`
          : reviewer.examinerUsername;
          
        recipient = {
          id: reviewer.examinerId,
          username: reviewerDisplayName
        };
      } else {
        // I am the reviewer, chatting with the author
        const authorDisplayName = rules.authorAnonymous
          ? `Author of Assignment ${submissionId.slice(0, 8)}`
          : match.submitterUsername;

        recipient = {
          id: match.submitterId,
          username: authorDisplayName
        };
      }

      onSelectUser(recipient, submissionId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New Submission Chat</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Autocomplete
          freeSolo
          options={Array.from(new Set([...assignments.map(a => a.submissionId), ...authorSubmissions]))}
          value={submissionId}
          onInputChange={(_, newValue) => setSubmissionId(newValue)}
          disabled={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              autoFocus
              margin="dense"
              label="Submission ID"
              variant="outlined"
              helperText="Select an assignment from the list, or manually enter the full Submission ID."
            />
          )}
        />
        {loading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleCreate} disabled={loading || !submissionId.trim()} color="primary" variant="contained">
          Start Chat
        </Button>
      </DialogActions>
    </Dialog>
  );
};
