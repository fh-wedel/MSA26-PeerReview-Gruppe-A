import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

type ReviewMode = 'double blind' | 'single blind' | 'open review';

interface SubmissionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, reviewMode: string) => void;
  authorName: string;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({ open, onClose, onSubmit, authorName }) => {
  const [title, setTitle] = useState('');
  const [reviewMode, setReviewMode] = useState<ReviewMode>('double blind');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleSubmit = () => {
    onSubmit(title, reviewMode);
    setTitle('');
    setReviewMode('double blind');
    setPdfFile(null);
    onClose();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPdfFile(file);
    }
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
          <TextField label="Authors" variant="outlined" fullWidth value={authorName} disabled />
          <FormControl fullWidth>
            <InputLabel id="review-mode-label">Review Mode</InputLabel>
            <Select
              labelId="review-mode-label"
              value={reviewMode}
              label="Review Mode"
              onChange={(e) => setReviewMode(e.target.value as ReviewMode)}
            >
              <MenuItem value="double blind">Double Blind</MenuItem>
              <MenuItem value="single blind">Single Blind</MenuItem>
              <MenuItem value="open review">Open Review</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" component="label" color={pdfFile ? 'primary' : 'inherit'}>
            {pdfFile ? pdfFile.name : 'Upload PDF Document'}
            <input type="file" hidden accept="application/pdf" onChange={handleFileChange} />
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={!title || !pdfFile}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};
