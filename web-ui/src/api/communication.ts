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
  id: string;       // Cognito sub UUID
  username: string;
  email?: string;   // not returned by the Communication Service /users endpoint
}

export interface MatchEntry {
  examinerId: string;
  examinerUsername: string;
  assignedAt: string;
}

export interface SubmissionMatchResponse {
  submissionId: string;
  status: 'MATCHED' | 'FAILED';
  submitterId: string;
  submitterUsername: string;
  matches: MatchEntry[];
}

export interface WorkflowRules {
  authorAnonymous: boolean;
  reviewerAnonymous: boolean;
  authorReviewerChatAllowed: boolean;
}

export interface WorkflowPlugin {
  name: string;
  title: string;
  description: string;
  rules: WorkflowRules;
}


import {communicationApiClient, matchingApiClient, workflowApiClient} from './clients';

export const fetchChats = async (): Promise<ChatListResponse> => {
  const response = await communicationApiClient.chats.listChats();
  return response.data as any;
};

export const fetchChatDetail = async (chatId: string, limit = 50, nextToken?: string): Promise<ChatDetailResponse> => {
  const response = await communicationApiClient.chats.getChat(chatId, {limit, nextToken});
  return response.data as any;
};

export const sendMessage = async (request: SendMessageRequest): Promise<ChatDetailResponse> => {
  const response = await communicationApiClient.chats.sendMessage(request as any);
  return response.data as any;
};

export const searchUsers = async (query: string): Promise<UserSummary[]> => {
  const response = await communicationApiClient.users.searchUsers({search: query});
  const raw = response.data.users || [];
  return raw.map(u => ({ id: u.sub, username: u.username }));
};

export const fetchSubmissionMatch = async (submissionId: string): Promise<SubmissionMatchResponse> => {
  const response = await matchingApiClient.matches.getMatchesBySubmission(submissionId);
  return response.data as any;
};

export const fetchWorkflowRulesForSubmission = async (submissionId: string): Promise<WorkflowRules> => {
  const response = await workflowApiClient.submissions.getRulesForSubmission(submissionId);
  return response.data as any;
};

export const fetchWorkflowPlugins = async (): Promise<WorkflowPlugin[]> => {
  const response = await workflowApiClient.plugins.listPlugins();
  return response.data as any;
};

