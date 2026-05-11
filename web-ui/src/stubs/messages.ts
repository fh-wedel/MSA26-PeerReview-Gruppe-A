export interface Message {
  id: string;
  sender: string;
  preview: string;
  unread: boolean;
  timestamp: string;
}

export const mockMessages: Message[] = [
  {
    id: '1',
    sender: 'Prof. Schmidt',
    preview: 'Please make sure to submit your review by tomorrow.',
    unread: true,
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    sender: 'System Admin',
    preview: 'Maintenance scheduled for this weekend.',
    unread: false,
    timestamp: new Date(Date.now() - 172800000).toISOString(),
  },
];
