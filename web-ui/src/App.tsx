import React from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {CustomThemeProvider} from './contexts/ThemeContext';
import {AuthProvider} from './contexts/AuthContext';
import {GuestLayout} from './layouts/GuestLayout';
import {AuthLayout} from './layouts/AuthLayout';
import {GuestHome} from './pages/GuestHome';
import {SignIn} from './pages/SignIn';
import {Register} from './pages/Register';
import {Dashboard} from './pages/Dashboard';
import {Assignments} from './pages/Assignments';
import {Submissions} from './pages/Submissions';
import {SubmissionDetails} from './pages/SubmissionDetails';
import {ChatProvider} from './contexts/ChatContext';
import {ChatPage} from './pages/ChatPage';
import {Admin} from './pages/Admin';
import {UserManagement} from './pages/UserManagement';
import {NotificationProvider} from './contexts/NotificationContext';

export const App: React.FC = () => {
  return (
    <BrowserRouter basename="/">
      <CustomThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <ChatProvider>
            <Routes>
              <Route element={<GuestLayout />}>
                <Route path="/" element={<GuestHome />} />
                <Route path="/login" element={<SignIn />} />
                <Route path="/register" element={<Register />} />
              </Route>
              
              <Route element={<AuthLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/assignments" element={<Assignments />} />
                <Route path="/assignments/:submissionId" element={<SubmissionDetails />} />
                <Route path="/submissions" element={<Submissions />} />
                <Route path="/submissions/:submissionId" element={<SubmissionDetails />} />
                <Route path="/chats" element={<ChatPage />} />
                  <Route path="/admin" element={<Admin/>}/>
                  <Route path="/users" element={<UserManagement/>}/>
              </Route>
            </Routes>
          </ChatProvider>
          </NotificationProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </BrowserRouter>
  );
};
