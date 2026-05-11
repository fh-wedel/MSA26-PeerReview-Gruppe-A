export interface Deadline {
  id: string;
  date: Date;
  title: string;
  type: 'SUBMISSION' | 'REVIEW' | 'FEEDBACK';
}

const today = new Date();

export const mockDeadlines: Deadline[] = [
  {
    id: '1',
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3),
    title: 'Review Due: Microservices',
    type: 'REVIEW',
  },
  {
    id: '2',
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
    title: 'Expected Feedback: Cloud Infrastructure',
    type: 'FEEDBACK',
  },
  {
    id: '3',
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14),
    title: 'Final Paper Submission',
    type: 'SUBMISSION',
  },
];
