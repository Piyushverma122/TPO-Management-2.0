import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { Login } from './pages/Login';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { ResetPasswordPage } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Companies } from './pages/Companies';
import { AddCompany } from './pages/AddCompany';
import { Drives } from './pages/Drives';
import { Applications } from './pages/Applications';
import { Eligibility } from './pages/Eligibility';
import { Resumes } from './pages/Resumes';
import { Interviews } from './pages/Interviews';
import { Offers } from './pages/Offers';
import { MessagesPage } from './pages/Messages';
import { Training } from './pages/Training';
import { Reports } from './pages/Reports';
import { Notifications } from './pages/Notifications';
import { ProfilePage } from './pages/Profile';
import { SettingsPage } from './pages/Settings';
import { UsersPage } from './pages/Users';
import { NotFound } from './pages/NotFound';
import { Unauthorized } from './pages/Unauthorized';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Module } from './config/rbac';

const queryClient = new QueryClient();

// Authenticated User Verification Wrapper
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

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

  // Force student to change password on first login
  if (user?.must_change_password && location.pathname !== '/settings') {
    return <Navigate to="/settings" state={{ forcePasswordChange: true }} replace />;
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

      {/* Public Only Authentication Routes */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute>
            <ForgotPasswordPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicOnlyRoute>
            <ResetPasswordPage />
          </PublicOnlyRoute>
        }
      />

      {/* Unauthorized 403 Page */}
      <Route
        path="/403"
        element={
          <RequireAuth>
            <Unauthorized />
          </RequireAuth>
        }
      />

      {/* Protected Main Layout & Protected Route Modules */}
      <Route
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute module={Module.DASHBOARD}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute module={Module.STUDENTS}>
              <Students />
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies"
          element={
            <ProtectedRoute module={Module.COMPANIES}>
              <Companies />
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies/add"
          element={
            <ProtectedRoute module={Module.COMPANIES}>
              <AddCompany />
            </ProtectedRoute>
          }
        />
        <Route
          path="/drives"
          element={
            <ProtectedRoute module={Module.PLACEMENT_DRIVES}>
              <Drives />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute module={Module.APPLICATIONS}>
              <Applications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/eligibility"
          element={
            <ProtectedRoute module={Module.PLACEMENT_DRIVES}>
              <Eligibility />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resumes"
          element={
            <ProtectedRoute module={Module.PROFILE}>
              <Resumes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interviews"
          element={
            <ProtectedRoute module={Module.INTERVIEWS}>
              <Interviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/offers"
          element={
            <ProtectedRoute module={Module.OFFER_LETTERS}>
              <Offers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute module={Module.NOTIFICATIONS}>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/training"
          element={
            <ProtectedRoute module={Module.TRAINING}>
              <Training />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute module={Module.REPORTS}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute module={Module.NOTIFICATIONS}>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute module={Module.PROFILE}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute module={Module.SETTINGS}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute module={Module.USERS}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
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
