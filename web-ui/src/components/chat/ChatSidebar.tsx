import React from "react";
import { Box, Typography, Tabs, Tab, List, ListItem, ListItemButton, ListItemAvatar, Avatar, ListItemText, Divider, Fab } from "@mui/material";
import { Group, AccountCircle, Add as AddIcon } from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";

interface ChatSidebarProps {
  chatTypeTab: "GENERAL" | "SUBMISSION";
  setChatTypeTab: (val: "GENERAL" | "SUBMISSION") => void;
  filteredChats: any[];
  selectedChatId: string | null;
  handleSelectChat: (chatId: string, otherParticipantId?: string) => void;
  submissionMap: Record<string, string>;
  userMap: Record<string, string>;
  handleFabClick: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chatTypeTab,
  setChatTypeTab,
  filteredChats,
  selectedChatId,
  handleSelectChat,
  submissionMap,
  userMap,
  handleFabClick
}) => {
  return (
    <Box sx={{ width: 320, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Chats</Typography>
      </Box>
      <Tabs value={chatTypeTab} onChange={(_, val) => setChatTypeTab(val)} variant="fullWidth">
        <Tab label="General" value="GENERAL" />
        <Tab label="Submissions" value="SUBMISSION" />
      </Tabs>
      <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
        {filteredChats.map((chat) => (
          <React.Fragment key={chat.chatId}>
            <ListItem disablePadding>
              <ListItemButton 
                selected={selectedChatId === chat.chatId} 
                onClick={() => handleSelectChat(chat.chatId, chat.otherParticipantId ?? undefined)}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: chat.chatType === 'SUBMISSION' ? 'secondary.main' : 'primary.main' }}>
                    {chat.chatType === 'SUBMISSION' ? <Group /> : <AccountCircle />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={
                    chat.chatType === 'SUBMISSION'
                      ? `Submission: ${submissionMap[chat.submissionId || ''] || chat.submissionId?.slice(0, 8) + '...'}`
                      : (userMap[chat.otherParticipantId || ''] || chat.otherParticipantId)
                  }
                  secondary={
                    chat.chatType === 'SUBMISSION'
                      ? ''
                      : (chat.lastMessageAt ? formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true }) : 'No messages')
                  }
                />
              </ListItemButton>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
        {filteredChats.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No chats found</Typography>
          </Box>
        )}
      </List>
      <Box sx={{ p: 2 }}>
        <Fab variant="extended" color="primary" sx={{ width: '100%' }} onClick={handleFabClick}>
          <AddIcon sx={{ mr: 1 }} /> New Chat
        </Fab>
      </Box>
    </Box>
  );
};
