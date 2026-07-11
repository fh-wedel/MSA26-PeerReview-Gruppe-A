import type { UserSummary } from "../api/communication";

export const validateSubmission = (
  selectedAuthors: UserSummary[],
  selectedCustomReviewers: UserSummary[],
  numberOfReviewers: number,
  activeTemplate: any | null
): string | null => {
  if (selectedAuthors.length === 0) {
    return "At least one author must be specified.";
  }

  if (selectedCustomReviewers.length > 0 && selectedCustomReviewers.length !== numberOfReviewers) {
    return `You selected manual reviewers. Please select exactly ${numberOfReviewers} reviewer(s).`;
  }
  
  if (activeTemplate && activeTemplate.maxAuthors !== undefined && activeTemplate.maxAuthors !== null && selectedAuthors.length > activeTemplate.maxAuthors) {
    return `At most ${activeTemplate.maxAuthors} author(s) allowed for this template.`;
  }

  if (activeTemplate && activeTemplate.minAuthors !== undefined && activeTemplate.minAuthors !== null && selectedAuthors.length < activeTemplate.minAuthors) {
    return `At least ${activeTemplate.minAuthors} author(s) required for this template.`;
  }

  return null;
};

export const checkIsSubmitDisabled = (
  title: string,
  topicTag: string,
  submitting: boolean,
  selectedAuthors: UserSummary[],
  selectedCustomReviewers: UserSummary[],
  numberOfReviewers: number,
  activeTemplate: any | null
): boolean => {
  if (!title || !topicTag || submitting || selectedAuthors.length === 0) return true;
  
  if (selectedCustomReviewers.length > 0 && selectedCustomReviewers.length !== numberOfReviewers) return true;
  
  if (activeTemplate?.maxAuthors !== undefined && activeTemplate?.maxAuthors !== null && selectedAuthors.length > activeTemplate.maxAuthors) return true;
  
  if (activeTemplate?.minAuthors !== undefined && activeTemplate?.minAuthors !== null && selectedAuthors.length < activeTemplate.minAuthors) return true;

  return false;
};

export const validateAuthorsChange = (
  newValue: UserSummary[],
  currentUserId: string,
  isAdminOrTeacher: boolean,
  isFixedAuthors: boolean,
  activeTemplate: any | null
): string => {
  if (!isAdminOrTeacher && !isFixedAuthors) {
    const hasSelf = newValue.some(u => u.id === currentUserId);
    if (!hasSelf) {
      return "You cannot remove yourself from this submission.";
    }
  }

  if (activeTemplate && activeTemplate.maxAuthors !== undefined && activeTemplate.maxAuthors !== null && newValue.length > activeTemplate.maxAuthors) {
    return `At most ${activeTemplate.maxAuthors} author(s) allowed for this template.`;
  }

  if (activeTemplate && activeTemplate.minAuthors !== undefined && activeTemplate.minAuthors !== null && newValue.length < activeTemplate.minAuthors) {
    return `At least ${activeTemplate.minAuthors} author(s) required for this template.`;
  }

  return "";
};
