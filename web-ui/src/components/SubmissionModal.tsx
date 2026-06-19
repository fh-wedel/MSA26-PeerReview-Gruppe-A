import React, {useState} from "react";
import {
  Alert,
  Autocomplete,
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
import type {UserSummary} from "../api/communication";
import {useUserResolver} from "../hooks/useUserResolver";

import {useWorkflowPlugins} from "../hooks/useWorkflowPlugins";

type ReviewType = string;

interface SubmissionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    title: string,
    reviewType: string,
    authorIds: string[],
    reviewTemplateType: string,
    numberOfReviewers: number,
    submissionDeadline: Date,
    reviewDeadline: Date
  ) => Promise<void>;
  authorName: string;
    currentUserId: string;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
  open,
  onClose,
  onSubmit,
  authorName,
                                                                    currentUserId,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [title, setTitle] = useState("");
  const [reviewType, setReviewType] = useState<ReviewType>("SINGLE_BLIND");
    const [selectedAuthors, setSelectedAuthors] = useState<UserSummary[]>([{ id: currentUserId, username: authorName }]);
  const { types, templates, loading, error } = useWorkflowPlugins();
  const [reviewTemplateType, setReviewTemplateType] = useState<string>("INDIVIDUAL_WORK");
  const [numberOfReviewers, setNumberOfReviewers] = useState<number>(2);
  const [submissionDeadline, setSubmissionDeadline] = useState<Date>(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
  const [reviewDeadline, setReviewDeadline] = useState<Date>(new Date(Date.now() + 28 * 24 * 60 * 60 * 1000));
  const { users: userOptions, loading: usersLoading } = useUserResolver();
  const [errorOpen, setErrorOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
    const [validationError, setValidationError] = useState("");

  React.useEffect(() => {
    if (error) {
      setErrorOpen(true);
    }
  }, [error]);

  const handleSubmit = async () => {
    setSubmitting(true);
      setValidationError("");
    try {
        const authorIds = selectedAuthors.map(u => u.id);
        await onSubmit(title, reviewType, authorIds, reviewTemplateType, numberOfReviewers, submissionDeadline, reviewDeadline);
      setTitle("");
      setReviewType("SINGLE_BLIND");
        setSelectedAuthors([{ id: currentUserId, username: authorName }]);
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
              {(() => {
                  const isAuthorsEnabled = true;
                  return (
                      <Autocomplete
                          multiple
                          options={userOptions}
                          getOptionLabel={(option) => option.username}
                          value={isAuthorsEnabled ? selectedAuthors : [{ id: currentUserId, username: authorName }]}
                          onChange={(_, newValue) => {
                              setSelectedAuthors(newValue);
                              setValidationError("");
                          }}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          disabled={!isAuthorsEnabled || submitting}
                          loading={usersLoading}
                          renderInput={(params) => (
                              <TextField
                                  {...params}
                                  label="Authors"
                                  variant="outlined"
                                  fullWidth
                                  error={!!validationError}
                                  helperText={validationError || "Select one or more authors"}
                              />
                          )}
                      />
                  );
              })()}
            <FormControl fullWidth>
                <InputLabel id="review-type-label">Review Type</InputLabel>
              <Select
                  labelId="review-type-label"
                  value={reviewType}
                  label="Review Type"
                  onChange={(e) => setReviewType(e.target.value as ReviewType)}
                disabled={loading || submitting}
              >
                {types.length > 0 ? (
                  types.map((plugin) => (
                    <MenuItem key={plugin.name} value={plugin.name}>
                      {plugin.title}
                    </MenuItem>
                  ))
                ) : (
                  <>
                    <MenuItem value="SINGLE_BLIND">Single Blind Review</MenuItem>
                    <MenuItem value="DOUBLE_BLIND">Double Blind Review</MenuItem>
                    <MenuItem value="OPEN_REVIEW">Open Review</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>

              
            <FormControl fullWidth>
                <InputLabel id="review-template-label">Review Template</InputLabel>
              <Select
                  labelId="review-template-label"
                  value={reviewTemplateType}
                  label="Review Template"
                  onChange={(e) => setReviewTemplateType(e.target.value as string)}
                disabled={loading || submitting}
              >
                {templates.length > 0 ? (
                  templates.map((template) => (
                    <MenuItem key={template.name} value={template.name || ""}>
                      {template.title}
                    </MenuItem>
                  ))
                ) : (
                  <>
                    <MenuItem value="INDIVIDUAL_WORK">Individual Work</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>

            <TextField
              label="Number of Reviewers"
              type="number"
              variant="outlined"
              fullWidth
              value={numberOfReviewers}
              onChange={(e) => setNumberOfReviewers(parseInt(e.target.value) || 0)}
              disabled={submitting}
              slotProps={{ htmlInput: { min: 1 } }}
            />
            
            <TextField
              label="Submission Deadline"
              type="date"
              variant="outlined"
              fullWidth
              value={submissionDeadline.toISOString().split('T')[0]}
              onChange={(e) => setSubmissionDeadline(new Date(e.target.value))}
              disabled={submitting}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Review Deadline"
              type="date"
              variant="outlined"
              fullWidth
              value={reviewDeadline.toISOString().split('T')[0]}
              onChange={(e) => setReviewDeadline(new Date(e.target.value))}
              disabled={submitting}
              slotProps={{ inputLabel: { shrink: true } }}
            />

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
