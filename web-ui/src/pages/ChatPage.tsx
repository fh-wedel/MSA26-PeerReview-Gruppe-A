import React, {useEffect, useState} from 'react';
import {
    Avatar,
    Box,
    Divider,
    Fab,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Tab,
    Tabs,
    Typography
} from '@mui/material';
import {AccountCircle, Add as AddIcon, Group} from '@mui/icons-material';
import {useChat} from '../contexts/ChatContext';
import {ChatWidget} from '../components/chat/ChatWidget';
import {UserSearchDialog} from '../components/chat/UserSearchDialog';
import {SubmissionChatDialog} from '../components/chat/SubmissionChatDialog';
import {formatDistanceToNow} from 'date-fns';
import type {UserSummary} from '../api/communication';
import {searchUsers} from '../api/communication';
import {useAuth} from '../contexts/AuthContext';
import {useLocation} from 'react-router-dom';
import { getChatTitle } from '../utils/chatHelpers';
import {configApiClient} from '../api/clients';
import {ChatSidebar} from '../components/chat/ChatSidebar';
import {MainChatArea} from '../components/chat/MainChatArea';
import { handleNewGeneralChatLogic, handleNewSubmissionChatLogic } from '../utils/chatPageHandlers';

export const ChatPage: React.FC = () => {
  const { chats } = useChat();
  const { user } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
    const location = useLocation();
    const tabParam = new URLSearchParams(location.search).get('tab');
    const [chatTypeTab, setChatTypeTab] = useState<'GENERAL' | 'SUBMISSION'>(
        tabParam === 'submissions' ? 'SUBMISSION' : 'GENERAL'
    );
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [submissionSearchOpen, setSubmissionSearchOpen] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [submissionMap, setSubmissionMap] = useState<Record<string, string>>({});

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

  useEffect(() => {
    const submissionIds = chats
      .filter(c => c.chatType === 'SUBMISSION' && c.submissionId)
      .map(c => c.submissionId as string);
    
    const uniqueIds = Array.from(new Set(submissionIds));
    
    uniqueIds.forEach(id => {
      setSubmissionMap(prev => {
        if (!prev[id]) {
            configApiClient.submissions.submissionsDetail(id)
                .then((res: any) => setSubmissionMap(current => ({...current, [id]: res.data.title || id})))
                .catch((err: any) => console.error(`Failed to load submission ${id}`, err));
          return { ...prev, [id]: 'Loading...' };
        }
        return prev;
      });
    });
  }, [chats]);

  const filteredChats = chats.filter(c => c.chatType === chatTypeTab);

  const handleNewGeneralChat = (selectedUser: UserSummary) => {
    handleNewGeneralChatLogic(
      selectedUser,
      chats,
      setSearchOpen,
      setSelectedChatId,
      setSelectedRecipientId,
      setUserMap,
      setChatTypeTab
    );
  };

  const handleNewSubmissionChat = (submissionId: string) => {
    handleNewSubmissionChatLogic(
      submissionId,
      chats,
      setSubmissionSearchOpen,
      setSelectedChatId,
      setSelectedRecipientId,
      setPendingSubmissionId,
      setChatTypeTab
    );
  };

  // We need a state for the pending submission ID
  const [pendingSubmissionId, setPendingSubmissionId] = useState<string | null>(null);

  const handleSelectChat = (chatId: string, otherParticipantId?: string) => {
    setSelectedChatId(chatId);
    setSelectedRecipientId(otherParticipantId ?? null);
    setPendingSubmissionId(null);
  };

  const handleFabClick = () => {
      if (chatTypeTab === 'SUBMISSION') {
          setSubmissionSearchOpen(true);
      } else {
          setSearchOpen(true);
      }
  };

  const title = getChatTitle(
    chatTypeTab,
    selectedChatId,
    pendingSubmissionId,
    filteredChats,
    submissionMap,
    userMap,
    selectedRecipientId
  );

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 220px)', bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
      <ChatSidebar
        chatTypeTab={chatTypeTab}
        setChatTypeTab={setChatTypeTab}
        filteredChats={filteredChats}
        selectedChatId={selectedChatId}
        handleSelectChat={handleSelectChat}
        submissionMap={submissionMap}
        userMap={userMap}
        handleFabClick={handleFabClick}
      />

      <MainChatArea
        selectedChatId={selectedChatId}
        selectedRecipientId={selectedRecipientId}
        pendingSubmissionId={pendingSubmissionId}
        chatTypeTab={chatTypeTab}
        filteredChats={filteredChats}
        title={title}
        setSelectedChatId={setSelectedChatId}
        setPendingSubmissionId={setPendingSubmissionId}
      />

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
        onStartSubmissionChat={handleNewSubmissionChat}
      />
    </Box>
  );
};
