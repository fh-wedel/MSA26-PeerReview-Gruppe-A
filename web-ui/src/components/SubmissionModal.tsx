import React, {useEffect, useState} from "react";
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
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import type {UserSummary} from "../api/communication";
import {useGroupMembers} from "../hooks/useGroupMembers";
import {useWorkflowPlugins} from "../hooks/useWorkflowPlugins";
import {useTopicTags} from "../hooks/useTopicTags";
import {useAuth} from "../contexts/AuthContext";
import {validateSubmission, checkIsSubmitDisabled, validateAuthorsChange} from "../utils/submissionValidation";
import {calculateSubmissionDefaults} from "../utils/submissionDefaults";
import {getSubmissionModalPermissions} from "../utils/submissionPermissions";
import {handleSubmissionModalSubmit} from "../utils/submissionHandlers";
import {AuthorField} from "./submission-modal/AuthorField";
import {ReviewTemplateField} from "./submission-modal/ReviewTemplateField";
import {ReviewTypeField} from "./submission-modal/ReviewTypeField";
import {TopicTagField} from "./submission-modal/TopicTagField";
import {CustomReviewerField} from "./submission-modal/CustomReviewerField";
import {DeadlineFields} from "./submission-modal/DeadlineFields";
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
  const { members: authorOptions, loading: authorsLoading } = useGroupMembers('Author');
  const { members: reviewerOptions, loading: reviewersLoading } = useGroupMembers('Reviewer');
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
    const defaults = calculateSubmissionDefaults(
      activeTemplate,
      currentUserId,
      authorName,
      isTeacherOrAdminInit,
      selectedAuthors.length
    );
    setNumberOfReviewers(defaults.numberOfReviewers);
    setSubmissionDeadline(defaults.submissionDeadline);
    setReviewDeadline(defaults.reviewDeadline);
    if (defaults.selectedAuthors !== undefined) {
      setSelectedAuthors(defaults.selectedAuthors);
    }
  }, [reviewTemplateType, currentUserId, authorName, activeTemplate, isTeacherOrAdminInit, selectedAuthors.length]);

  const {
    isFixedAuthors,
    isFixedReviewers,
    isFixedDeadlines,
    isAdminOrTeacher,
    canEditAuthors,
    canAddCustomReviewer
  } = getSubmissionModalPermissions(activeTemplate, user);

  const handleSubmit = async () => {
    await handleSubmissionModalSubmit(
      isSubmitDisabled,
      setHasAttemptedSubmit,
      validateSubmission,
      selectedAuthors,
      selectedCustomReviewers,
      numberOfReviewers,
      activeTemplate,
      setValidationError,
      setSubmitting,
      onSubmit,
      title,
      reviewType,
      reviewTemplateType,
      submissionDeadline,
      reviewDeadline,
      topicTag,
      setTitle,
      setReviewType,
      setTopicTag,
      setSelectedAuthors,
      setSelectedCustomReviewers,
      setReviewTemplateType,
      isTeacherOrAdminInit,
      currentUserId,
      authorName,
      onClose,
      setErrorOpen
    );
  };

  const isSubmitDisabled = checkIsSubmitDisabled(
    title, topicTag, submitting, selectedAuthors, selectedCustomReviewers, numberOfReviewers, activeTemplate
  );

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
            
            <ReviewTemplateField
              reviewTemplateType={reviewTemplateType}
              setReviewTemplateType={setReviewTemplateType}
              loading={loading}
              submitting={submitting}
              templates={templates}
            />

            <AuthorField
              authorOptions={authorOptions}
              selectedAuthors={selectedAuthors}
              setSelectedAuthors={setSelectedAuthors}
              validationError={validationError}
              setValidationError={setValidationError}
              hasAttemptedSubmit={hasAttemptedSubmit}
              canEditAuthors={canEditAuthors && !submitting}
              isFixedAuthors={isFixedAuthors}
              authorsLoading={authorsLoading}
              isAdminOrTeacher={isAdminOrTeacher}
              currentUserId={currentUserId}
              activeTemplate={activeTemplate}
            />

            <CustomReviewerField
              canAddCustomReviewer={canAddCustomReviewer}
              reviewerOptions={reviewerOptions}
              selectedCustomReviewers={selectedCustomReviewers}
              setSelectedCustomReviewers={setSelectedCustomReviewers}
              submitting={submitting}
              reviewersLoading={reviewersLoading}
            />
            
            <ReviewTypeField
              reviewType={reviewType}
              setReviewType={setReviewType}
              loading={loading}
              submitting={submitting}
              types={types}
            />

            <TopicTagField
              topicTag={topicTag}
              setTopicTag={setTopicTag}
              tagsLoading={tagsLoading}
              submitting={submitting}
              topicTags={topicTags}
              hasAttemptedSubmit={hasAttemptedSubmit}
            />

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
            
            <DeadlineFields
              submissionDeadline={submissionDeadline}
              setSubmissionDeadline={setSubmissionDeadline}
              reviewDeadline={reviewDeadline}
              setReviewDeadline={setReviewDeadline}
              isFixedDeadlines={isFixedDeadlines}
              submitting={submitting}
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
