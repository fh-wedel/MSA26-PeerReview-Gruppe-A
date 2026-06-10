import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { ArrowBack, Chat as ChatIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ChatWidget } from '../components/chat/ChatWidget';
import { useAuth } from '../contexts/AuthContext';
import { fetchSubmissionMatch, fetchWorkflowRulesForSubmission } from '../api/communication';
import type { UserSummary } from '../api/communication';
import { useChat } from '../contexts/ChatContext';

export const SubmissionDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { submissionId } = useParams();

  const isAssignmentsPage = location.pathname.startsWith('/assignments');
  const backTarget = isAssignmentsPage ? '/assignments' : '/submissions';
  const backText = isAssignmentsPage ? 'Back to Assignments' : 'Back to Submissions';

  const [chatOpen, setChatOpen] = React.useState(new URLSearchParams(location.search).get('chat') === 'true');
  const [recipient, setRecipient] = React.useState<UserSummary | null>(null);
  const [chatAllowed, setChatAllowed] = React.useState(true);
  const [loadingContext, setLoadingContext] = React.useState(true);
  
  const { user } = useAuth();
  const { chats } = useChat();

  React.useEffect(() => {
    if (!submissionId || !user) return;
    
    setLoadingContext(true);
    Promise.all([
      fetchSubmissionMatch(submissionId).catch(() => null),
      fetchWorkflowRulesForSubmission(submissionId).catch(() => null)
    ]).then(([match, fetchedRules]) => {
      
      if (match && fetchedRules) {
        if (!fetchedRules.authorReviewerChatAllowed) {
            setChatAllowed(false);
        } else {
            setChatAllowed(true);
            const isAuthor = match.submitterId === user.id;
            const examinerMatch = match.matches.find(m => m.examinerId === user.id);
            const isReviewer = !!examinerMatch;
            
            if (isAuthor && match.matches.length > 0) {
                // Pick first reviewer
                const reviewer = match.matches[0];
                const reviewerDisplayName = fetchedRules.reviewerAnonymous
                  ? `Reviewer for Assignment ${submissionId.slice(0, 8)}`
                  : reviewer.examinerUsername;
                  
                setRecipient({
                    id: reviewer.examinerId,
                    username: reviewerDisplayName
                });
            } else if (isReviewer) {
                const authorDisplayName = fetchedRules.authorAnonymous
                  ? `Author of Assignment ${submissionId.slice(0, 8)}`
                  : match.submitterUsername;

                setRecipient({
                    id: match.submitterId,
                    username: authorDisplayName
                });
            } else {
                setChatAllowed(false);
            }
        }
      } else {
          setChatAllowed(false);
      }
      setLoadingContext(false);
    });
  }, [submissionId, user]);
  
  const existingChat = React.useMemo(() => {
      if (!submissionId || !recipient) return null;
      return chats.find(c => c.chatType === 'SUBMISSION' && c.submissionId === submissionId && c.otherParticipantId === recipient.id);
  }, [chats, submissionId, recipient]);


  return (
    <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
      <Box sx={{ flexGrow: 1 }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<ArrowBack />}
        sx={{ mb: 2 }}
        onClick={() => navigate(backTarget)}
      >
        {backText}
      </Button>

      </Box>

      {/* Floating Action Button to toggle Chat */}
      {!chatOpen && chatAllowed && !loadingContext && recipient && (
        <Button
          variant="contained"
          color="secondary"
          startIcon={<ChatIcon />}
          onClick={() => setChatOpen(true)}
          sx={{ position: 'fixed', bottom: 32, right: 32, borderRadius: 20 }}
        >
          Submission Chat
        </Button>
      )}

      {/* Chat Sidebar */}
      {chatOpen && recipient && (
        <Box sx={{ width: 400, borderLeft: 1, borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Chat with {recipient.username}</Typography>
            <IconButton onClick={() => setChatOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <ChatWidget 
              chatId={existingChat?.chatId}
              recipientId={recipient.id}
              displayName={recipient.username}
              chatType="SUBMISSION" 
              submissionId={submissionId} 
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};
