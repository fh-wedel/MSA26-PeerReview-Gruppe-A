export interface ChatUser {
  id: string;
  name: string;
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
  id: string;
  participants: ChatUser[];
  messages: ChatMessage[];
}

export const mockUsers: ChatUser[] = [
  { id: 'u1', name: 'Alice Smith' },
  { id: 'u2', name: 'Bob Johnson' },
  { id: 'u3', name: 'Prof. Schmidt' },
  { id: 'u4', name: 'System Admin' },
];

export const mockChatThreads: ChatThread[] = [
  {
    id: 't1',
    participants: [
      { id: 'current_user', name: 'Me' },
      { id: 'u3', name: 'Prof. Schmidt' },
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
    participants: [
      { id: 'current_user', name: 'Me' },
      { id: 'u4', name: 'System Admin' },
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
