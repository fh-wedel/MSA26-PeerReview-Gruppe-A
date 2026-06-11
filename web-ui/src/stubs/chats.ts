export interface ChatUser {
  id: string;
  username: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  format?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
}

export interface ChatThread {
  submissionId?: string;
  id: string;
  participants: ChatUser[];
  messages: ChatMessage[];
}

export const mockUsers: ChatUser[] = [
  { id: 'u1', username: 'Alice Smith' },
  { id: 'u2', username: 'Bob Johnson' },
  { id: 'u3', username: 'Prof. Schmidt' },
  { id: 'u4', username: 'System Admin' },
];

export const mockChatThreads: ChatThread[] = [
  {
    id: 't1',
    submissionId: '7f4d5b51-4fb7-4033-9f52-2f9df08f02f1',
    participants: [
      { id: 'current_user', username: 'Me' },
      { id: 'u3', username: 'Prof. Schmidt' },
    ],
    messages: [
      {
        id: 'm1',
        senderId: 'u3',
        text: 'Please make sure to submit your review by tomorrow.',
        timestamp: new Date().toISOString(),
      },
    ],
  },
  {
    id: 't2',
    submissionId: '1f0a6d1c-77ab-4a28-b7d7-0b1b8f8f9059',
    participants: [
      { id: 'current_user', username: 'Me' },
      { id: 'u4', username: 'System Admin' },
    ],
    messages: [
      {
        id: 'm2',
        senderId: 'u4',
        text: 'Maintenance scheduled for this weekend.',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
      },
    ],
  },
];
