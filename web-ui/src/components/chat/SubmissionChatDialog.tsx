import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress, Alert, Autocomplete } from '@mui/material';
import { fetchWorkflowRulesForSubmission } from '../../api/communication';
import { configApiClient } from '../../api/clients';
import { useAuth } from '../../contexts/AuthContext';
import { useAssignments } from '../../hooks/useAssignments';

interface SubmissionChatDialogProps {
  open: boolean;
  onClose: () => void;
  onStartSubmissionChat: (submissionId: string) => void;
}

export const SubmissionChatDialog: React.FC<SubmissionChatDialogProps> = ({ open, onClose, onStartSubmissionChat }) => {
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
          const configs = (res.data as unknown as Array<Record<string, unknown>>) || [];
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
      // Validate workflow rules — chat must be allowed for this review type
      const rules = await fetchWorkflowRulesForSubmission(submissionId);
      if (!rules.authorReviewerChatAllowed) {
        throw new Error('Chat is not allowed for this review type (Double Blind).');
      }

      // All good — start the group chat. The backend will resolve all participants
      // from the Matching Service when the first message is sent.
      onStartSubmissionChat(submissionId);

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
