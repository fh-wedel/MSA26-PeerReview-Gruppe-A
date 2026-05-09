import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material';

interface SubmissionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, abstract: string) => void;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({ open, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');

  const handleSubmit = () => {
    onSubmit(title, abstract);
    setTitle('');
    setAbstract('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Submit Paper for Review</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Paper Title"
            variant="outlined"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            label="Abstract"
            variant="outlined"
            fullWidth
            multiline
            rows={4}
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
          />
          <Button variant="outlined" component="label">
            Upload PDF Document
            <input type="file" hidden accept="application/pdf" />
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={!title}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};
