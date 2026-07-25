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
import { Training } from './pages/Training';
import { Reports } from './pages/Reports';
import { Notifications } from './pages/Notifications';
import { ProfilePage } from './pages/Profile';
import { SettingsPage } from './pages/Settings';
import { NotFound } from './pages/NotFound';
import { MainLayout } from './components/layout/MainLayout';

const queryClient = new QueryClient();

// Protected Route Wrapper for Authenticated Users
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#A3E635] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Public Only Route Wrapper (Redirects logged-in users away from /login)
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#A3E635] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />

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
        <Route path="/training" element={<Training />} />
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
