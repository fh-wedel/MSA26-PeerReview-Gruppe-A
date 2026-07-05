import React from "react";
import { Box, Typography } from "@mui/material";
import { ChatWidget } from "./ChatWidget";

interface MainChatAreaProps {
  selectedChatId: string | null;
  selectedRecipientId: string | null;
  pendingSubmissionId: string | null;
  chatTypeTab: 'GENERAL' | 'SUBMISSION';
  filteredChats: any[];
  title: string;
  setSelectedChatId: (val: string | null) => void;
  setPendingSubmissionId: (val: string | null) => void;
}

export const MainChatArea: React.FC<MainChatAreaProps> = ({
  selectedChatId,
  selectedRecipientId,
  pendingSubmissionId,
  chatTypeTab,
  filteredChats,
  title,
  setSelectedChatId,
  setPendingSubmissionId
}) => {
  const hasSelection = selectedChatId || selectedRecipientId || pendingSubmissionId;
  const submissionId = chatTypeTab === 'SUBMISSION' 
    ? (selectedChatId ? filteredChats.find(c => c.chatId === selectedChatId)?.submissionId : pendingSubmissionId) || undefined 
    : undefined;

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      {hasSelection ? (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
          <Typography variant="h6">
            {title}
          </Typography>
        </Box>
      ) : null}
      
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {hasSelection ? (
          <ChatWidget 
            chatId={selectedChatId || undefined} 
            recipientId={selectedRecipientId || undefined} 
            chatType={chatTypeTab}
            submissionId={submissionId}
            onChatCreated={(newChatId) => {
              setSelectedChatId(newChatId);
              setPendingSubmissionId(null);
            }}
          />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography color="text.secondary">Select a chat or start a new one</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
