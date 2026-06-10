import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemButton, ListItemAvatar, Avatar, ListItemText, Divider, Fab, Tabs, Tab } from '@mui/material';
import { AccountCircle, Add as AddIcon, Description } from '@mui/icons-material';
import { useChat } from '../contexts/ChatContext';
import { ChatWidget } from '../components/chat/ChatWidget';
import { UserSearchDialog } from '../components/chat/UserSearchDialog';
import { SubmissionChatDialog } from '../components/chat/SubmissionChatDialog';
import { formatDistanceToNow } from 'date-fns';
import { searchUsers } from '../api/communication';
import type { UserSummary } from '../api/communication';
import { useAuth } from '../contexts/AuthContext';

export const ChatPage: React.FC = () => {
  const { chats } = useChat();
  const { user } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [chatTypeTab, setChatTypeTab] = useState<'GENERAL' | 'SUBMISSION'>('GENERAL');
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [submissionSearchOpen, setSubmissionSearchOpen] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch users once to resolve usernames
    searchUsers('')
      .then(users => {
        const map: Record<string, string> = {};
        users.forEach(u => map[u.id] = u.username);
        setUserMap(map);
      })
      .catch(err => console.error('Failed to load user map', err));
  }, []);

  const filteredChats = chats.filter(c => c.chatType === chatTypeTab);

  const handleNewGeneralChat = (selectedUser: UserSummary) => {
    setSearchOpen(false);
    // Check if a GENERAL chat already exists with this user
    const existing = chats.find(c => c.chatType === 'GENERAL' && c.otherParticipantId === selectedUser.id);
    if (existing) {
      setSelectedChatId(existing.chatId);
      setSelectedRecipientId(existing.otherParticipantId);
      setChatTypeTab('GENERAL');
    } else {
      setSelectedChatId(null);
      setSelectedRecipientId(selectedUser.id);
      // We temporarily store the selectedUser's display name so it shows nicely before chat is created
      setUserMap(prev => ({...prev, [selectedUser.id]: selectedUser.username}));
      setChatTypeTab('GENERAL');
    }
  };

  const handleNewSubmissionChat = (selectedUser: UserSummary, submissionId: string) => {
    setSubmissionSearchOpen(false);
    
    // Check if a SUBMISSION chat already exists with this user for this submission
    const existing = chats.find(c => c.chatType === 'SUBMISSION' && c.submissionId === submissionId && c.otherParticipantId === selectedUser.id);
    
    if (existing) {
      setSelectedChatId(existing.chatId);
      setSelectedRecipientId(existing.otherParticipantId);
      setChatTypeTab('SUBMISSION');
    } else {
      setSelectedChatId(null);
      setSelectedRecipientId(selectedUser.id);
      // Store pseudonym in userMap so it displays correctly before chat creation
      setUserMap(prev => ({...prev, [selectedUser.id]: selectedUser.username}));
      setChatTypeTab('SUBMISSION');
      // We need a way to pass the submissionId to the ChatWidget if we are creating a new one
      // The ChatPage needs to hold the "pending" submissionId
    }
  };

  // We need a state for the pending submission ID
  const [pendingSubmissionId, setPendingSubmissionId] = useState<string | null>(null);

  const handleSelectChat = (chatId: string, otherParticipantId: string) => {
    setSelectedChatId(chatId);
    setSelectedRecipientId(otherParticipantId);
    setPendingSubmissionId(null);
  };

  const handleFabClick = () => {
      if (chatTypeTab === 'SUBMISSION') {
          setSubmissionSearchOpen(true);
      } else {
          setSearchOpen(true);
      }
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 220px)', bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
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
                    primary={userMap[chat.otherParticipantId] || chat.otherParticipantId}
                    secondary={
                        chat.chatType === 'SUBMISSION' 
                        ? `Submission: ${chat.submissionId?.slice(0, 8)}...` 
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

      {/* Main Chat Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {(selectedChatId || selectedRecipientId) ? (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
            <Typography variant="h6">
              Chat with {userMap[selectedRecipientId || ''] || selectedRecipientId} {chatTypeTab === 'SUBMISSION' && '(Submission)'}
            </Typography>
          </Box>
        ) : null}
        
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          {(selectedChatId || selectedRecipientId) ? (
            <ChatWidget 
              chatId={selectedChatId || undefined} 
              recipientId={selectedRecipientId || undefined} 
              chatType={chatTypeTab}
              submissionId={chatTypeTab === 'SUBMISSION' ? (selectedChatId ? filteredChats.find(c => c.chatId === selectedChatId)?.submissionId : pendingSubmissionId) || undefined : undefined}
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
        onSelectUser={handleNewGeneralChat} 
        excludeUserId={user?.id}
        existingGeneralChats={chats.filter(c => c.chatType === 'GENERAL')}
      />
      <SubmissionChatDialog
        open={submissionSearchOpen}
        onClose={() => setSubmissionSearchOpen(false)}
        onSelectUser={(selectedUser, subId) => {
            setPendingSubmissionId(subId);
            handleNewSubmissionChat(selectedUser, subId);
        }}
      />
    </Box>
  );
};
