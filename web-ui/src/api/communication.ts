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
  const token = sessionStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const httpStatusMessage = (status: number, defaultMsg: string): string => {
  switch (status) {
    case 400: return 'Bad request – please check your input and try again.';
    case 401: return 'You are not authenticated. Please log in and try again.';
    case 403: return 'Access denied – you do not have permission to perform this action.';
    case 404: return 'The requested resource was not found.';
    case 409: return 'A conflict occurred – the resource may already exist.';
    case 422: return 'Unprocessable request – the server could not process your input.';
    case 429: return 'Too many requests – please wait a moment and try again.';
    case 500: return 'A server error occurred. Please try again later.';
    case 502: return 'Service is temporarily unavailable (Bad Gateway). Please try again.';
    case 503: return 'Service is currently unavailable. Please try again later.';
    case 504: return 'The request timed out. Please try again.';
    default: return defaultMsg;
  }
};

const handleResponseError = async (response: Response, defaultMsg: string): Promise<never> => {
  let errMsg = httpStatusMessage(response.status, defaultMsg);
  try {
    const errData = await response.json();
    // Prefer the server's own descriptive message over the generic one
    if (errData.message) errMsg = errData.message;
    else if (errData.error) errMsg = errData.error;
    else if (typeof errData === 'string') errMsg = errData;
  } catch (_) {
    // JSON parsing failed – stick with the status-based message
  }
  throw new Error(errMsg);
};

export const fetchChats = async (): Promise<ChatListResponse> => {
  const response = await fetch('/api/communication/chats', {
    headers: getHeaders(),
  });
  if (!response.ok) await handleResponseError(response, 'Failed to fetch chats');
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
  if (!response.ok) await handleResponseError(response, 'Failed to fetch chat detail');
  return response.json();
};

export const sendMessage = async (request: SendMessageRequest): Promise<ChatDetailResponse> => {
  const response = await fetch('/api/communication/chats/messages', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });
  if (!response.ok) await handleResponseError(response, 'Failed to send message');
  return response.json();
};

export const searchUsers = async (query: string): Promise<UserSummary[]> => {
  const response = await fetch(`/api/communication/users?search=${encodeURIComponent(query)}`, {
    headers: getHeaders(),
  });
  if (!response.ok) await handleResponseError(response, 'Failed to search users');
  return response.json();
};
