export const getChatTitle = (
  chatTypeTab: 'GENERAL' | 'SUBMISSION',
  selectedChatId: string | null,
  pendingSubmissionId: string | null,
  filteredChats: any[],
  submissionMap: Record<string, string>,
  userMap: Record<string, string>,
  selectedRecipientId: string | null
): string => {
  if (chatTypeTab === 'SUBMISSION') {
    const subId = selectedChatId
      ? filteredChats.find(c => c.chatId === selectedChatId)?.submissionId
      : pendingSubmissionId;
    const title = subId ? (submissionMap[subId] || subId) : 'Unknown Submission';
    return `Submission Chat: ${title}`;
  }
  return `Chat with ${userMap[selectedRecipientId || ''] || selectedRecipientId}`;
};
