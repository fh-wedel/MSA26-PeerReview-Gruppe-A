export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  date: string;
}

export const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Review Assigned',
    message: 'You have been assigned to review "Architecture Patterns in Microservices".',
    read: false,
    date: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Feedback Received',
    message: 'Your paper "Event-Driven Systems" has received new feedback.',
    read: true,
    date: new Date(Date.now() - 86400000).toISOString(),
  },
];
