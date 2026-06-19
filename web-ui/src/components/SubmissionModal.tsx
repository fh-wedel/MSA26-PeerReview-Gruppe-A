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
  Autocomplete,
} from "@mui/material";
import type { UserSummary } from "../api/communication";
import { useUserResolver } from "../hooks/useUserResolver";

import {useWorkflowPlugins} from "../hooks/useWorkflowPlugins";

type ReviewType = string;

interface SubmissionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    title: string,
    reviewType: string,
    authorIds: string[],
  ) => Promise<void>;
  authorName: string;
    currentUserId: string;
    isAdminOrOfficer: boolean;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
  open,
  onClose,
  onSubmit,
  authorName,
                                                                    currentUserId,
                                                                    isAdminOrOfficer,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [title, setTitle] = useState("");
    const [reviewType, setReviewType] = useState<ReviewType>("INDIVIDUAL_WORK");
    const [selectedAuthors, setSelectedAuthors] = useState<UserSummary[]>([{ id: currentUserId, username: authorName }]);
  const { plugins, loading, error } = useWorkflowPlugins();
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
        const selectedPlugin = plugins.find(p => p.name === reviewType);
        const isAuthorsEnabled = isAdminOrOfficer || (selectedPlugin && selectedPlugin.numberOfAuthors > 1);
        const authorIds = isAuthorsEnabled
            ? selectedAuthors.map(u => u.id)
            : [currentUserId];

        if (selectedPlugin && authorIds.length !== selectedPlugin.numberOfAuthors) {
            setValidationError(`Please enter exactly ${selectedPlugin.numberOfAuthors} author(s)`);
            setSubmitting(false);
            return;
        }

        await onSubmit(title, reviewType, authorIds);
      setTitle("");
        setReviewType("INDIVIDUAL_WORK");
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
                  const selectedPlugin = plugins.find(p => p.name === reviewType);
                  const isAuthorsEnabled = isAdminOrOfficer || (selectedPlugin && selectedPlugin.numberOfAuthors > 1);
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
                                  helperText={validationError || (isAuthorsEnabled ? `Expected number of authors: ${selectedPlugin?.numberOfAuthors || 1}` : "")}
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

              {plugins.length > 0 && (
                  <Box sx={{mt: 1, p: 2, bgcolor: "background.default", borderRadius: 1}}>
                      {(() => {
                          const selectedPlugin = plugins.find(p => p.name === reviewType);
                          if (!selectedPlugin) return null;

                          const parseDur = (dur: string) => {
                              if (!dur) return 0;
                              const h = dur.match(/PT(\d+)H/);
                              if (h) return parseInt(h[1]) / 24;
                              const d = dur.match(/P(\d+)D/);
                              if (d) return parseInt(d[1]);
                              return 0;
                          };
                          const subDays = parseDur(selectedPlugin.submissionDeadlineDuration);
                          const revDays = parseDur(selectedPlugin.reviewDeadlineDuration);

                          return (
                              <Box sx={{
                                  typography: "body2",
                                  color: "text.secondary",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 0.5
                              }}>
                                  <div><strong>Authors:</strong> {selectedPlugin.numberOfAuthors}</div>
                                  <div><strong>Reviewers:</strong> {selectedPlugin.numberOfReviewers}</div>
                                  <div><strong>Submission Deadline:</strong> in {subDays} days</div>
                                  <div><strong>Review Deadline:</strong> in {subDays + revDays} days</div>
                              </Box>
                          );
                      })()}
                  </Box>
              )}
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
