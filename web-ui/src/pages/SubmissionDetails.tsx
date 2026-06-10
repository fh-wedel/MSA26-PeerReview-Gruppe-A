import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { ArrowBack, Chat as ChatIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ChatWidget } from '../components/chat/ChatWidget';

export const SubmissionDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { submissionId } = useParams();

  const isAssignmentsPage = location.pathname.startsWith('/assignments');
  const backTarget = isAssignmentsPage ? '/assignments' : '/submissions';
  const backText = isAssignmentsPage ? 'Back to Assignments' : 'Back to Submissions';

  const [chatOpen, setChatOpen] = React.useState(new URLSearchParams(location.search).get('chat') === 'true');

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
      {!chatOpen && (
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
      {chatOpen && (
        <Box sx={{ width: 400, borderLeft: 1, borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Submission Chat</Typography>
            <IconButton onClick={() => setChatOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <ChatWidget 
              chatType="SUBMISSION" 
              submissionId={submissionId} 
              // recipientId would normally be determined by the backend or the active context. For assignments, the author. For submissions, the reviewer.
              // For now, the user can start typing. A real implementation would pass the target user ID based on submission metadata.
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};
