export type SubmissionReviewMode = string;

export type SubmissionStatus =
  | 'Draft'
  | 'Submitted'
  | 'Reviewer Assigned'
  | 'Under Review'
  | 'Review Completed'
  | 'Published';

export interface SubmissionHistoryEntry {
  id: string;
  label: string;
  changedAt: string;
  description?: string;
}

export interface SubmissionReview {
  reviewedAt: string;
  decision: string;
  summary: string;
  strengths: string[];
  improvements: string[];
}

export interface SubmissionDetail {
  id: string;
  title: string;
  createdAt: string;
  documentName: string;
  documentUrl?: string;
  reviewMode: SubmissionReviewMode;
  status: SubmissionStatus;
  authorId?: string;
  authorName?: string;
  reviewerId?: string;
  reviewerName?: string;
  history: SubmissionHistoryEntry[];
  review?: SubmissionReview;
}

export const mockSubmissions: SubmissionDetail[] = [];

export const getMockSubmissionById = (_submissionId: string): SubmissionDetail | undefined => undefined;
