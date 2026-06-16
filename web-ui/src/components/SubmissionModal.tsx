import React, {useState} from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {useWorkflowPlugins} from "../hooks/useWorkflowPlugins";

type ReviewMode = string;

interface SubmissionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    title: string,
    reviewMode: string,
  ) => Promise<void>;
  authorName: string;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
  open,
  onClose,
  onSubmit,
  authorName,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [title, setTitle] = useState("");
  const [reviewMode, setReviewMode] = useState<ReviewMode>("INDIVIDUAL_WORK");
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
      await onSubmit(title, reviewMode);
      setTitle("");
      setReviewMode("INDIVIDUAL_WORK");
      onClose();
    } catch (err) {
      console.error("Submission failed:", err);
      setErrorOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
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
                    <MenuItem value="INDIVIDUAL_WORK">Individual Work</MenuItem>
                    <MenuItem value="GROUP_WORK">Group Work</MenuItem>
                    <MenuItem value="BACHELOR_THESIS">Bachelor Thesis</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>
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
