import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress, Alert, Autocomplete } from '@mui/material';
import { fetchWorkflowRulesForSubmission } from '../../api/communication';
import { configApiClient } from '../../api/clients';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useAssignments } from '../../hooks/useAssignments';

interface SubmissionOption {
  id: string;
  title: string;
  allowed: boolean;
  reason?: string;
}

interface SubmissionChatDialogProps {
  open: boolean;
  onClose: () => void;
  onStartSubmissionChat: (submissionId: string) => void;
}

export const SubmissionChatDialog: React.FC<SubmissionChatDialogProps> = ({ open, onClose, onStartSubmissionChat }) => {
  const [submissionOption, setSubmissionOption] = useState<SubmissionOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [options, setOptions] = useState<SubmissionOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  
  const { user } = useAuth();
  const { chats } = useChat();
  const { assignments } = useAssignments();

  useEffect(() => {
    if (!open) {
      setSubmissionOption(null);
      setError(null);
      setOptions([]);
      return;
    }

    if (user?.id) {
      setOptionsLoading(true);
      configApiClient.author.authorDetail(user.id, { format: 'json' })
        .then(async res => {
          const configs = (res.data as unknown as Array<Record<string, unknown>>) || [];
          const authorIds = configs.map(c => (c.id || c.submissionId) as string);
          
          const allIds = Array.from(new Set([...assignments.map(a => a.submissionId), ...authorIds]));
          
          const newOptions: SubmissionOption[] = [];
          for (const id of allIds) {
            if (!id) continue;
            try {
              const [subRes, rules] = await Promise.all([
                configApiClient.submissionId.getSubmissionId(id).catch(() => null),
                fetchWorkflowRulesForSubmission(id).catch(() => null)
              ]);
              
              const title = subRes?.data?.title || id;
              const isWorkflowAllowed = rules ? !!rules.authorReviewerChatAllowed : false;
              const existingChat = chats.find(c => c.chatType === 'SUBMISSION' && c.submissionId === id);
              
              const allowed = isWorkflowAllowed && !existingChat;
              let reason = undefined;
              if (existingChat) {
                reason = 'A chat for this submission already exists';
              } else if (!isWorkflowAllowed) {
                reason = 'Communication not allowed in the current review phase (e.g. Double Blind)';
              }
              
              newOptions.push({
                id,
                title,
                allowed,
                reason
              });
            } catch (e) {
              console.error(`Failed to load details for submission ${id}`, e);
            }
          }
          
          setOptions(newOptions);
        })
        .catch(err => {
          console.error(err);
          setError('Failed to load submissions.');
        })
        .finally(() => {
          setOptionsLoading(false);
        });
    }
  }, [user?.id, open, assignments, chats]);

  const handleCreate = async () => {
    if (!submissionOption) {
      setError('Submission is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!submissionOption.allowed) {
        throw new Error('Chat is not allowed for this review type.');
      }

      onStartSubmissionChat(submissionOption.id);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New Submission Chat</DialogTitle>
      <DialogContent sx={{ overflowY: 'visible' }}>
        {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
        <Autocomplete
          options={options}
          loading={optionsLoading}
          getOptionLabel={(option) => typeof option === 'string' ? option : `${option.title} (${option.id.slice(0, 8)}...)`}
          getOptionDisabled={(option) => !option.allowed}
          value={submissionOption}
          onChange={(_, newValue) => {
             if (typeof newValue === 'string') {
               setSubmissionOption({ id: newValue, title: newValue, allowed: true });
             } else {
               setSubmissionOption(newValue);
             }
          }}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          disabled={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              autoFocus
              margin="dense"
              label="Submission"
              variant="outlined"
              helperText="Select an assignment or your submission from the list."
            />
          )}
          renderOption={(props, option) => (
            <li {...props}>
              <div>
                <strong>{option.title}</strong>
                <br/>
                <small style={{ color: 'gray' }}>ID: {option.id}</small>
                {!option.allowed && (
                  <div style={{ color: 'red', fontSize: '0.8em' }}>{option.reason}</div>
                )}
              </div>
            </li>
          )}
        />
        {loading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleCreate} disabled={loading || !submissionOption} color="primary" variant="contained">
          Start Chat
        </Button>
      </DialogActions>
    </Dialog>
  );
};
