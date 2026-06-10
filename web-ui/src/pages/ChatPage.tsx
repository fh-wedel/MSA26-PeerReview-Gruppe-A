import React, { useState } from 'react';
import { Box, Typography, List, ListItem, ListItemButton, ListItemAvatar, Avatar, ListItemText, Divider, Fab, Tabs, Tab } from '@mui/material';
import { AccountCircle, Add as AddIcon, Description } from '@mui/icons-material';
import { useChat } from '../contexts/ChatContext';
import { ChatWidget } from '../components/chat/ChatWidget';
import { UserSearchDialog } from '../components/chat/UserSearchDialog';
import { formatDistanceToNow } from 'date-fns';
import type { UserSummary } from '../api/communication';

export const ChatPage: React.FC = () => {
  const { chats } = useChat();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [chatTypeTab, setChatTypeTab] = useState<'GENERAL' | 'SUBMISSION'>('GENERAL');
  
  const [searchOpen, setSearchOpen] = useState(false);

  const filteredChats = chats.filter(c => c.chatType === chatTypeTab);

  const handleSelectChat = (chatId: string, otherParticipantId: string) => {
    setSelectedChatId(chatId);
    setSelectedRecipientId(otherParticipantId);
  };

  const handleNewChat = (user: UserSummary) => {
    setSearchOpen(false);
    // Check if a GENERAL chat already exists with this user
    const existing = chats.find(c => c.chatType === 'GENERAL' && c.otherParticipantId === user.id);
    if (existing) {
      setSelectedChatId(existing.chatId);
      setSelectedRecipientId(existing.otherParticipantId);
      setChatTypeTab('GENERAL');
    } else {
      setSelectedChatId(null);
      setSelectedRecipientId(user.id);
      setChatTypeTab('GENERAL');
    }
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
      {/* Sidebar List */}
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
                  onClick={() => handleSelectChat(chat.chatId, chat.otherParticipantId)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: chat.chatType === 'SUBMISSION' ? 'secondary.main' : 'primary.main' }}>
                      {chat.chatType === 'SUBMISSION' ? <Description /> : <AccountCircle />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={chat.otherParticipantId} // TODO: Map participant ID to username via UserService cache if possible, for now showing ID or we can rely on backend username injection in future
                    secondary={chat.lastMessageAt ? formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true }) : 'No messages'}
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
          <Fab variant="extended" color="primary" sx={{ width: '100%' }} onClick={() => setSearchOpen(true)}>
            <AddIcon sx={{ mr: 1 }} /> New Chat
          </Fab>
        </Box>
      </Box>

      {/* Main Chat Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {(selectedChatId || selectedRecipientId) ? (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
            <Typography variant="h6">
              Chat with {selectedRecipientId} {chatTypeTab === 'SUBMISSION' && '(Submission)'}
            </Typography>
          </Box>
        ) : null}
        
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          {(selectedChatId || selectedRecipientId) ? (
            <ChatWidget 
              chatId={selectedChatId || undefined} 
              recipientId={selectedRecipientId || undefined} 
              chatType={chatTypeTab}
              onChatCreated={(newChatId) => setSelectedChatId(newChatId)}
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography color="text.secondary">Select a chat or start a new one</Typography>
            </Box>
          )}
        </Box>
      </Box>

      <UserSearchDialog 
        open={searchOpen} 
        onClose={() => setSearchOpen(false)} 
        onSelectUser={handleNewChat} 
      />
    </Box>
  );
};
