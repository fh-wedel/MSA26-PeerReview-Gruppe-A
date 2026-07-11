export const getSubmissionModalPermissions = (
  activeTemplate: any | null,
  user: any
) => {
  const isFixedAuthors = activeTemplate ? (activeTemplate.minAuthors === activeTemplate.maxAuthors && activeTemplate.minAuthors !== undefined && activeTemplate.minAuthors !== null) : false;
  const isFixedReviewers = activeTemplate ? (activeTemplate.minReviewers === activeTemplate.maxReviewers && activeTemplate.minReviewers !== undefined && activeTemplate.minReviewers !== null) : false;
  const isFixedDeadlines = activeTemplate ? (activeTemplate.submissionDurationDays !== undefined && activeTemplate.submissionDurationDays !== null) : false;

  const roles = (user?.roles || []).map((r: string) => r.toLowerCase());
  const isAdminOrTeacher = roles.includes('admin') || roles.includes('examinationofficer') || roles.includes('teacher');
  
  const canEditAuthors = isAdminOrTeacher || (!isFixedAuthors);
  const canAddCustomReviewer = isAdminOrTeacher || (activeTemplate?.allowAuthorCustomReviewer ?? false);

  return {
    isFixedAuthors,
    isFixedReviewers,
    isFixedDeadlines,
    isAdminOrTeacher,
    canEditAuthors,
    canAddCustomReviewer
  };
};
