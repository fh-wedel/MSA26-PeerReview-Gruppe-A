export interface Message {
  messageId: string;
  senderId: string;
  body: string;
  sentAt: string;
}

export interface ChatDetailResponse {
  chatId: string;
  participantA: string;
  participantB: string;
  chatType: 'GENERAL' | 'SUBMISSION';
  submissionId?: string;
  createdAt: string;
  nextToken?: string;
  messages: Message[];
}

export interface ChatSummary {
  chatId: string;
  otherParticipantId: string;
  chatType: 'GENERAL' | 'SUBMISSION';
  submissionId?: string;
  lastMessageAt?: string;
}

export interface ChatListResponse {
  chats: ChatSummary[];
}

export interface SendMessageRequest {
  recipientId: string;
  body: string;
  chatContext: {
    type: 'GENERAL' | 'SUBMISSION';
    submissionId?: string;
  };
}

export interface UserSummary {
  id: string;
  username: string;
  email: string;
}

const getHeaders = () => {
  const token = sessionStorage.getItem('id_token') || sessionStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const fetchChats = async (): Promise<ChatListResponse> => {
  const response = await fetch('/api/communication/chats', {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch chats');
  return response.json();
};

export const fetchChatDetail = async (chatId: string, limit = 50, nextToken?: string): Promise<ChatDetailResponse> => {
  let url = `/api/communication/chats/${chatId}?limit=${limit}`;
  if (nextToken) {
    url += `&nextToken=${encodeURIComponent(nextToken)}`;
  }
  const response = await fetch(url, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch chat detail');
  return response.json();
};

export const sendMessage = async (request: SendMessageRequest): Promise<ChatDetailResponse> => {
  const response = await fetch('/api/communication/chats/messages', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Failed to send message');
  return response.json();
};

export const searchUsers = async (query: string): Promise<UserSummary[]> => {
  const response = await fetch(`/api/communication/users?search=${encodeURIComponent(query)}`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to search users');
  return response.json();
};
