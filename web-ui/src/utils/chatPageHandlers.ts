import type { UserSummary } from '../api/communication';

export const handleNewGeneralChatLogic = (
  selectedUser: UserSummary,
  chats: any[],
  setSearchOpen: (val: boolean) => void,
  setSelectedChatId: (val: string | null) => void,
  setSelectedRecipientId: (val: string | null) => void,
  setUserMap: (updater: (prev: Record<string, string>) => Record<string, string>) => void,
  setChatTypeTab: (val: 'GENERAL' | 'SUBMISSION') => void
) => {
  setSearchOpen(false);
  const existing = chats.find(c => c.chatType === 'GENERAL' && c.otherParticipantId === selectedUser.id);
  if (existing) {
    setSelectedChatId(existing.chatId);
    setSelectedRecipientId(existing.otherParticipantId ?? null);
    setChatTypeTab('GENERAL');
  } else {
    setSelectedChatId(null);
    setSelectedRecipientId(selectedUser.id);
    setUserMap(prev => ({...prev, [selectedUser.id]: selectedUser.username}));
    setChatTypeTab('GENERAL');
  }
};

export const handleNewSubmissionChatLogic = (
  submissionId: string,
  chats: any[],
  setSubmissionSearchOpen: (val: boolean) => void,
  setSelectedChatId: (val: string | null) => void,
  setSelectedRecipientId: (val: string | null) => void,
  setPendingSubmissionId: (val: string | null) => void,
  setChatTypeTab: (val: 'GENERAL' | 'SUBMISSION') => void
) => {
  setSubmissionSearchOpen(false);
  const existing = chats.find(c => c.chatType === 'SUBMISSION' && c.submissionId === submissionId);
  if (existing) {
    setSelectedChatId(existing.chatId);
    setSelectedRecipientId(null);
    setChatTypeTab('SUBMISSION');
    setPendingSubmissionId(null);
  } else {
    setSelectedChatId(null);
    setSelectedRecipientId(null);
    setPendingSubmissionId(submissionId);
    setChatTypeTab('SUBMISSION');
  }
};
