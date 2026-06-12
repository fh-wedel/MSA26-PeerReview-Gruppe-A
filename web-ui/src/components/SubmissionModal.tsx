import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import { useWorkflowPlugins } from "../hooks/useWorkflowPlugins";

type ReviewMode = string;

interface SubmissionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    title: string,
    reviewMode: string,
    file: File | null,
  ) => Promise<void>;
  authorName: string;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
  open,
  onClose,
  onSubmit,
  authorName,
}) => {
  const [title, setTitle] = useState("");
  const [reviewMode, setReviewMode] = useState<ReviewMode>("double-blind");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const { plugins, loading, error } = useWorkflowPlugins();
  const [errorOpen, setErrorOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (error) {
      setErrorOpen(true);
    }
  }, [error]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(title, reviewMode, pdfFile);
      setTitle("");
      setReviewMode("double-blind");
      setPdfFile(null);
      onClose();
    } catch (err) {
      console.error("Submission failed:", err);
      setErrorOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPdfFile(file);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Create Submission</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Paper Title"
              variant="outlined"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
            />
            <TextField
              label="Authors"
              variant="outlined"
              fullWidth
              value={authorName}
              disabled
            />
            <FormControl fullWidth>
              <InputLabel id="review-mode-label">Review Mode</InputLabel>
              <Select
                labelId="review-mode-label"
                value={reviewMode}
                label="Review Mode"
                onChange={(e) => setReviewMode(e.target.value as ReviewMode)}
                disabled={loading || submitting}
              >
                {plugins.length > 0 ? (
                  plugins.map((plugin) => (
                    <MenuItem key={plugin.name} value={plugin.name}>
                      {plugin.title}
                    </MenuItem>
                  ))
                ) : (
                  <>
                    <MenuItem value="double-blind">Double Blind</MenuItem>
                    <MenuItem value="single-blind">Single Blind</MenuItem>
                    <MenuItem value="open-review">Open Review</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              component="label"
              color={pdfFile ? "primary" : "inherit"}
              disabled={submitting}
            >
              {pdfFile ? pdfFile.name : "Upload PDF Document (Optional)"}
              <input
                type="file"
                hidden
                accept="application/pdf"
                onChange={handleFileChange}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={!title || submitting}
          >
            {submitting ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={errorOpen}
        autoHideDuration={6000}
        onClose={() => setErrorOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ mt: 8 }}
      >
        <Alert
          onClose={() => setErrorOpen(false)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {submitting
            ? "Failed to create submission. Please try again."
            : "Failed to load workflow plugins."}
        </Alert>
      </Snackbar>
    </>
  );
};
