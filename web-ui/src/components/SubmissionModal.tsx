import React, {useState, useEffect} from "react";
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
  Typography,
} from "@mui/material";
import type {UserSummary} from "../api/communication";
import {useUserResolver} from "../hooks/useUserResolver";
import {useWorkflowPlugins} from "../hooks/useWorkflowPlugins";
import {useTopicTags} from "../hooks/useTopicTags";
import {useAuth} from "../contexts/AuthContext";

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
    reviewDeadline: Date,
    topicTag: string,
    customReviewerIds: string[]
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
  const { user } = useAuth();
  const isTeacherOrAdminInit = (user?.roles || []).map(r => r.toLowerCase()).some(r => ['admin', 'examinationofficer', 'teacher'].includes(r));
  
  const [title, setTitle] = useState("");
  const [reviewType, setReviewType] = useState<ReviewType>("SINGLE_BLIND");
  const [selectedAuthors, setSelectedAuthors] = useState<UserSummary[]>(isTeacherOrAdminInit ? [] : [{ id: currentUserId, username: authorName }]);
  const [selectedCustomReviewers, setSelectedCustomReviewers] = useState<UserSummary[]>([]);
  const { types, templates, loading, error } = useWorkflowPlugins();
  const [reviewTemplateType, setReviewTemplateType] = useState<string>("INDIVIDUAL_WORK");
  const [numberOfReviewers, setNumberOfReviewers] = useState<number>(1);
  const [submissionDeadline, setSubmissionDeadline] = useState<Date>(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
  const [reviewDeadline, setReviewDeadline] = useState<Date>(new Date(Date.now() + 28 * 24 * 60 * 60 * 1000));
  
  const { users: userOptions, loading: usersLoading } = useUserResolver();
  const [errorOpen, setErrorOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [topicTag, setTopicTag] = useState<string>("");
  const { topicTags, loading: tagsLoading } = useTopicTags();

  useEffect(() => {
    if (error) {
      setErrorOpen(true);
    }
  }, [error]);

  // Find the currently selected template details
  const activeTemplate = templates.find(t => t.name === reviewTemplateType) || null;

  useEffect(() => {
    if (!activeTemplate) return;
    const now = new Date();

    // Default reviewers
    if (activeTemplate.minReviewers !== undefined && activeTemplate.minReviewers !== null) {
      setNumberOfReviewers(activeTemplate.minReviewers);
    } else {
      setNumberOfReviewers(1);
    }

    // Default deadlines
    if (activeTemplate.submissionDurationDays !== undefined && activeTemplate.submissionDurationDays !== null) {
      const subDead = new Date(now.getTime() + activeTemplate.submissionDurationDays * 24 * 60 * 60 * 1000);
      setSubmissionDeadline(subDead);
      if (activeTemplate.reviewDurationDays !== undefined && activeTemplate.reviewDurationDays !== null) {
        setReviewDeadline(new Date(subDead.getTime() + activeTemplate.reviewDurationDays * 24 * 60 * 60 * 1000));
      }
    } else {
      setSubmissionDeadline(new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000));
      setReviewDeadline(new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000));
    }

    // Default authors: if the template enforces exactly 1 author, reset selected authors
    if (activeTemplate.minAuthors === 1 && activeTemplate.maxAuthors === 1) {
      if (!isTeacherOrAdminInit && selectedAuthors.length !== 1) {
        setSelectedAuthors([{ id: currentUserId, username: authorName }]);
      } else if (isTeacherOrAdminInit && selectedAuthors.length > 1) {
        setSelectedAuthors([]);
      }
    }
  }, [reviewTemplateType, currentUserId, authorName, activeTemplate, isTeacherOrAdminInit, selectedAuthors.length]);

  const isFixedAuthors = activeTemplate ? (activeTemplate.minAuthors === activeTemplate.maxAuthors && activeTemplate.minAuthors !== undefined && activeTemplate.minAuthors !== null) : false;
  const isFixedReviewers = activeTemplate ? (activeTemplate.minReviewers === activeTemplate.maxReviewers && activeTemplate.minReviewers !== undefined && activeTemplate.minReviewers !== null) : false;
  const isFixedDeadlines = activeTemplate ? (activeTemplate.submissionDurationDays !== undefined && activeTemplate.submissionDurationDays !== null) : false;

  const roles = (user?.roles || []).map(r => r.toLowerCase());
  const isAdminOrTeacher = roles.includes('admin') || roles.includes('examinationofficer') || roles.includes('teacher');
  
  const canEditAuthors = isAdminOrTeacher || (!isFixedAuthors);
  const canAddCustomReviewer = isAdminOrTeacher || (activeTemplate?.allowAuthorCustomReviewer ?? false);

  const handleSubmit = async () => {
    setHasAttemptedSubmit(true);
    
    if (isSubmitDisabled) {
      if (selectedAuthors.length === 0) {
        setValidationError("At least one author must be selected.");
      }
      return;
    }
    
    if (activeTemplate && activeTemplate.maxAuthors !== undefined && activeTemplate.maxAuthors !== null && selectedAuthors.length > activeTemplate.maxAuthors) {
      setValidationError(`At most ${activeTemplate.maxAuthors} author(s) allowed for this template.`);
      return;
    }
    if (activeTemplate && activeTemplate.minAuthors !== undefined && activeTemplate.minAuthors !== null && selectedAuthors.length < activeTemplate.minAuthors) {
      setValidationError(`At least ${activeTemplate.minAuthors} author(s) required for this template.`);
      return;
    }
    
    setSubmitting(true);
    setValidationError("");
    try {
      const authorIds = selectedAuthors.map(u => u.id);
      const customReviewerIds = selectedCustomReviewers.map(u => u.id);
      await onSubmit(title, reviewType, authorIds, reviewTemplateType, numberOfReviewers, submissionDeadline, reviewDeadline, topicTag, customReviewerIds);
      setTitle("");
      setReviewType("SINGLE_BLIND");
      setTopicTag("");
      setSelectedAuthors(isTeacherOrAdminInit ? [] : [{ id: currentUserId, username: authorName }]);
      setSelectedCustomReviewers([]);
      setReviewTemplateType("INDIVIDUAL_WORK");
      setHasAttemptedSubmit(false);
      onClose();
    } catch (err) {
      console.error("Submission failed:", err);
      setErrorOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitDisabled = !title || !topicTag || submitting || selectedAuthors.length === 0 || 
    (activeTemplate?.maxAuthors !== undefined && activeTemplate?.maxAuthors !== null && selectedAuthors.length > activeTemplate.maxAuthors) ||
    (activeTemplate?.minAuthors !== undefined && activeTemplate?.minAuthors !== null && selectedAuthors.length < activeTemplate.minAuthors);

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
        <DialogTitle>Create Submission</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            
            <TextField
              label="Paper Title *"
              variant="outlined"
              fullWidth
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (hasAttemptedSubmit) setHasAttemptedSubmit(false);
              }}
              disabled={submitting}
              error={hasAttemptedSubmit && !title}
              helperText={!title ? "Title is mandatory" : ""}
            />
            
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
                    <MenuItem value="GROUP_WORK">Group Work</MenuItem>
                    <MenuItem value="BACHELOR_THESIS">Bachelor Thesis</MenuItem>
                    <MenuItem value="MASTER_THESIS">Master Thesis</MenuItem>
                    <MenuItem value="SEMINAR">Seminar</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>

            <Autocomplete
                multiple
                options={userOptions}
                getOptionLabel={(option) => option.username}
                value={selectedAuthors}
                onChange={(_, newValue) => {
                    // If author is not admin/teacher and it's not fixed authors, prevent removing themselves
                    if (!isAdminOrTeacher && !isFixedAuthors) {
                      const hasSelf = newValue.some(u => u.id === currentUserId);
                      if (!hasSelf) {
                        setValidationError("You cannot remove yourself from this submission.");
                        return;
                      }
                    }
                    if (activeTemplate && activeTemplate.maxAuthors !== undefined && activeTemplate.maxAuthors !== null && newValue.length > activeTemplate.maxAuthors) {
                        setValidationError(`At most ${activeTemplate.maxAuthors} author(s) allowed for this template.`);
                        return;
                    }
                    if (activeTemplate && activeTemplate.minAuthors !== undefined && activeTemplate.minAuthors !== null && newValue.length < activeTemplate.minAuthors) {
                        setValidationError(`At least ${activeTemplate.minAuthors} author(s) required for this template.`);
                        // We still set it so user can build up the list
                    } else {
                        setValidationError("");
                    }
                    setSelectedAuthors(newValue);
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disabled={!canEditAuthors || submitting}
                loading={usersLoading}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Authors *"
                        variant="outlined"
                        fullWidth
                        error={hasAttemptedSubmit && !!validationError}
                        helperText={
                          validationError || 
                          (!canEditAuthors 
                            ? "Author selection is locked for this template or your role." 
                            : isFixedAuthors ? "Exactly one author is required." : "Select one or more authors.")
                        }
                    />
                )}
            />

            {canAddCustomReviewer && (
              <Autocomplete
                  multiple
                  options={userOptions}
                  getOptionLabel={(option) => option.username}
                  value={selectedCustomReviewers}
                  onChange={(_, newValue) => {
                      setSelectedCustomReviewers(newValue);
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  disabled={submitting}
                  loading={usersLoading}
                  renderInput={(params) => (
                      <TextField
                          {...params}
                          label="Custom Reviewers (Optional)"
                          variant="outlined"
                          fullWidth
                          helperText="Select specific reviewers to bypass the automatic matching process."
                      />
                  )}
              />
            )}
            
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

            <FormControl fullWidth error={hasAttemptedSubmit && !topicTag}>
              <InputLabel id="topic-tag-label">Topic Tag *</InputLabel>
              <Select
                labelId="topic-tag-label"
                value={topicTag}
                label="Topic Tag *"
                onChange={(e) => {
                  setTopicTag(e.target.value as string);
                  if (hasAttemptedSubmit) setHasAttemptedSubmit(false);
                }}
                disabled={tagsLoading || submitting}
              >
                {topicTags.map((tag) => (
                  <MenuItem key={tag.tagName} value={tag.tagName || ""}>
                    {tag.tagName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Number of Reviewers"
              type="number"
              variant="outlined"
              fullWidth
              value={numberOfReviewers}
              onChange={(e) => setNumberOfReviewers(parseInt(e.target.value) || 0)}
              disabled={isFixedReviewers || submitting}
              slotProps={{ htmlInput: { min: 1 } }}
              helperText={isFixedReviewers ? `Fixed to ${numberOfReviewers} for this template.` : ""}
            />
            
            <TextField
              label="Submission Deadline"
              type="date"
              variant="outlined"
              fullWidth
              value={submissionDeadline.toISOString().split('T')[0]}
              onChange={(e) => setSubmissionDeadline(new Date(e.target.value))}
              disabled={isFixedDeadlines || submitting}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText={isFixedDeadlines ? "Submission deadline is fixed for this template." : ""}
            />

            <TextField
              label="Review Deadline"
              type="date"
              variant="outlined"
              fullWidth
              value={reviewDeadline.toISOString().split('T')[0]}
              onChange={(e) => setReviewDeadline(new Date(e.target.value))}
              disabled={isFixedDeadlines || submitting}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText={isFixedDeadlines ? "Review deadline is fixed for this template." : ""}
            />

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={submitting}>
            Cancel
          </Button>
          <Box component="span" sx={{ position: 'relative' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create"}
            </Button>
            {hasAttemptedSubmit && isSubmitDisabled && !submitting && (
              <Typography variant="caption" color="error" sx={{ position: 'absolute', bottom: -20, right: 0, width: 'max-content' }}>
                Please fill mandatory fields correctly
              </Typography>
            )}
          </Box>
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
