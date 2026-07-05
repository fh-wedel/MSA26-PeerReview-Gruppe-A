import type { UserSummary } from "../api/communication";

export interface SubmissionDefaults {
  numberOfReviewers: number;
  submissionDeadline: Date;
  reviewDeadline: Date;
  selectedAuthors: UserSummary[] | undefined;
}

export const calculateSubmissionDefaults = (
  activeTemplate: any,
  currentUserId: string,
  authorName: string,
  isTeacherOrAdminInit: boolean,
  currentSelectedAuthorsLength: number,
  now = new Date()
): SubmissionDefaults => {
  let numberOfReviewers = 1;
  if (activeTemplate.minReviewers !== undefined && activeTemplate.minReviewers !== null) {
    numberOfReviewers = activeTemplate.minReviewers;
  }

  let submissionDeadline = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  let reviewDeadline = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

  if (activeTemplate.submissionDurationDays !== undefined && activeTemplate.submissionDurationDays !== null) {
    submissionDeadline = new Date(now.getTime() + activeTemplate.submissionDurationDays * 24 * 60 * 60 * 1000);
    if (activeTemplate.reviewDurationDays !== undefined && activeTemplate.reviewDurationDays !== null) {
      reviewDeadline = new Date(submissionDeadline.getTime() + activeTemplate.reviewDurationDays * 24 * 60 * 60 * 1000);
    }
  }

  let selectedAuthors: UserSummary[] | undefined = undefined;
  if (activeTemplate.minAuthors === 1 && activeTemplate.maxAuthors === 1) {
    if (!isTeacherOrAdminInit && currentSelectedAuthorsLength !== 1) {
      selectedAuthors = [{ id: currentUserId, username: authorName }];
    } else if (isTeacherOrAdminInit && currentSelectedAuthorsLength > 1) {
      selectedAuthors = [];
    }
  }

  return {
    numberOfReviewers,
    submissionDeadline,
    reviewDeadline,
    selectedAuthors
  };
};
