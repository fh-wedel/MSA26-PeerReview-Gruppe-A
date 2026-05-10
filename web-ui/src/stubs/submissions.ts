export type SubmissionReviewMode = 'double blind' | 'single blind' | 'open review';

export type SubmissionStatus =
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
  reviewerName?: string;
  history: SubmissionHistoryEntry[];
  review?: SubmissionReview;
}

export const formatSubmissionReviewMode = (reviewMode: SubmissionReviewMode): string => {
  switch (reviewMode) {
    case 'double blind':
      return 'Double Blind';
    case 'single blind':
      return 'Single Blind';
    case 'open review':
      return 'Open Review';
    default:
      return reviewMode;
  }
};

export const mockSubmissions: SubmissionDetail[] = [
  {
    id: '7f4d5b51-4fb7-4033-9f52-2f9df08f02f1',
    title: 'Event-Driven Systems in Modern Architecture',
    createdAt: '2023-10-12T09:30:00Z',
    documentName: 'event-driven-systems.pdf',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    reviewMode: 'double blind',
    status: 'Under Review',
    history: [
      {
        id: 'submitted',
        label: 'Submitted',
        changedAt: '2023-10-12T09:30:00Z',
        description: 'Your manuscript was uploaded successfully.',
      },
      {
        id: 'reviewer-assigned',
        label: 'Reviewer Assigned',
        changedAt: '2023-10-14T13:10:00Z',
        description: 'A reviewer has been assigned according to the double-blind workflow.',
      },
      {
        id: 'under-review',
        label: 'Under Review',
        changedAt: '2023-10-15T08:45:00Z',
        description: 'The review process is currently in progress.',
      },
    ],
  },
  {
    id: '1f0a6d1c-77ab-4a28-b7d7-0b1b8f8f9059',
    title: 'Microfrontend Patterns',
    createdAt: '2023-09-05T14:15:00Z',
    documentName: 'microfrontend-patterns.pdf',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    reviewMode: 'open review',
    status: 'Published',
    reviewerName: 'Prof. Dr. Ada Sommer',
    history: [
      {
        id: 'submitted',
        label: 'Submitted',
        changedAt: '2023-09-05T14:15:00Z',
        description: 'Your manuscript was uploaded successfully.',
      },
      {
        id: 'reviewer-assigned',
        label: 'Reviewer Assigned',
        changedAt: '2023-09-06T10:00:00Z',
        description: 'Prof. Dr. Ada Sommer accepted the review assignment.',
      },
      {
        id: 'review-completed',
        label: 'Review Completed',
        changedAt: '2023-09-12T16:20:00Z',
        description: 'The review was submitted and shared because this submission uses open review.',
      },
      {
        id: 'published',
        label: 'Published',
        changedAt: '2023-09-14T09:00:00Z',
        description: 'The submission and review are now visible to participants.',
      },
    ],
    review: {
      reviewedAt: '2023-09-12T16:20:00Z',
      decision: 'Accepted with minor revisions',
      summary:
        'The paper presents a clear introduction to microfrontend integration patterns and uses practical examples effectively.',
      strengths: [
        'Well-structured explanation of composition approaches.',
        'Good balance between architectural trade-offs and implementation details.',
      ],
      improvements: [
        'Expand the section about testing strategies across independent teams.',
        'Clarify how shared design systems are governed over time.',
      ],
    },
  },
];

export const getMockSubmissionById = (submissionId: string): SubmissionDetail | undefined =>
  mockSubmissions.find((submission) => submission.id === submissionId);
