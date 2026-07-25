import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Companies } from './pages/Companies';
import { AddCompany } from './pages/AddCompany';
import { Drives } from './pages/Drives';
import { Applications } from './pages/Applications';
import { Eligibility } from './pages/Eligibility';
import { Resumes } from './pages/Resumes';
import { Interviews } from './pages/Interviews';
import { MessagesPage } from './pages/Messages';
import { Reports } from './pages/Reports';
import { Notifications } from './pages/Notifications';
import { ProfilePage } from './pages/Profile';
import { SettingsPage } from './pages/Settings';
import { NotFound } from './pages/NotFound';
import { MainLayout } from './components/layout/MainLayout';

const queryClient = new QueryClient();

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Placeholder view for secondary routes until requested
const PagePlaceholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="bg-[#162032] border border-[#202D42] rounded-3xl p-10 text-center space-y-4">
    <div className="w-14 h-14 rounded-2xl bg-[#A3E635]/10 text-[#A3E635] border border-[#A3E635]/30 flex items-center justify-center mx-auto font-bold text-xl">
      S
    </div>
    <h2 className="text-2xl font-extrabold text-white">{title}</h2>
    <p className="text-sm text-[#94A3B8] max-w-md mx-auto">
      This page module is ready for interaction.
    </p>
  </div>
);

export const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/add" element={<AddCompany />} />
        <Route path="/drives" element={<Drives />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/eligibility" element={<Eligibility />} />
        <Route path="/resumes" element={<Resumes />} />
        <Route path="/interviews" element={<Interviews />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/training" element={<PagePlaceholder title="Training Module" />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <AppContent />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
