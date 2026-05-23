import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { GuestLayout } from './layouts/GuestLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { GuestHome } from './pages/GuestHome';
import { SignIn } from './pages/SignIn';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { MySubmissions } from './pages/MySubmissions';
import { SubmissionDetails } from './pages/SubmissionDetails';
import { Assignments } from './pages/Assignments';

export const App: React.FC = () => {
  return (
    <BrowserRouter basename="/prod/">
      <CustomThemeProvider>
        <AuthProvider>
          <Routes>
            <Route element={<GuestLayout />}>
              <Route path="/" element={<GuestHome />} />
              <Route path="/login" element={<SignIn />} />
              <Route path="/register" element={<Register />} />
            </Route>
            
            <Route element={<AuthLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/submissions" element={<MySubmissions />} />
              <Route path="/submissions/:submissionId" element={<SubmissionDetails />} />
              <Route path="/assignments" element={<Assignments />} />
            </Route>
          </Routes>
        </AuthProvider>
      </CustomThemeProvider>
    </BrowserRouter>
  );
};
