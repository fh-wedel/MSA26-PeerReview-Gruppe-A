export const handleSubmissionModalSubmit = async (
  isSubmitDisabled: boolean,
  setHasAttemptedSubmit: (val: boolean) => void,
  validateSubmission: (authors: any[], reviewers: any[], num: number, template: any) => string | null,
  selectedAuthors: any[],
  selectedCustomReviewers: any[],
  numberOfReviewers: number,
  activeTemplate: any,
  setValidationError: (err: string) => void,
  setSubmitting: (val: boolean) => void,
  onSubmit: any,
  title: string,
  reviewType: string,
  reviewTemplateType: string,
  submissionDeadline: Date,
  reviewDeadline: Date,
  topicTag: string,
  setTitle: (val: string) => void,
  setReviewType: (val: string) => void,
  setTopicTag: (val: string) => void,
  setSelectedAuthors: (val: any[]) => void,
  setSelectedCustomReviewers: (val: any[]) => void,
  setReviewTemplateType: (val: string) => void,
  isTeacherOrAdminInit: boolean,
  currentUserId: string,
  authorName: string,
  onClose: () => void,
  setErrorOpen: (val: boolean) => void
) => {
  setHasAttemptedSubmit(true);

  const validationErrorMsg = validateSubmission(selectedAuthors, selectedCustomReviewers, numberOfReviewers, activeTemplate);
  if (validationErrorMsg) {
    setValidationError(validationErrorMsg);
    return;
  }

  if (isSubmitDisabled) {
    return;
  }

  setSubmitting(true);
  setValidationError("");
  try {
    const authorIds = selectedAuthors.map(u => u.id);
    const customReviewerIds = selectedCustomReviewers.map(u => u.id);
    await onSubmit(
      title,
      reviewType,
      authorIds,
      reviewTemplateType,
      numberOfReviewers,
      submissionDeadline,
      reviewDeadline,
      topicTag,
      customReviewerIds
    );
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
