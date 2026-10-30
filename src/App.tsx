import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/app/Toast';
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPassword').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPassword').then((m) => ({ default: m.ResetPasswordPage })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Students = lazy(() => import('./pages/Students').then((m) => ({ default: m.Students })));
const Companies = lazy(() => import('./pages/Companies').then((m) => ({ default: m.Companies })));
const AddCompany = lazy(() => import('./pages/AddCompany').then((m) => ({ default: m.AddCompany })));
const Drives = lazy(() => import('./pages/Drives').then((m) => ({ default: m.Drives })));
const Applications = lazy(() => import('./pages/Applications').then((m) => ({ default: m.Applications })));
const Eligibility = lazy(() => import('./pages/Eligibility').then((m) => ({ default: m.Eligibility })));
const Resumes = lazy(() => import('./pages/Resumes').then((m) => ({ default: m.Resumes })));
const Interviews = lazy(() => import('./pages/Interviews').then((m) => ({ default: m.Interviews })));
const Offers = lazy(() => import('./pages/Offers').then((m) => ({ default: m.Offers })));
const MessagesPage = lazy(() => import('./pages/Messages').then((m) => ({ default: m.MessagesPage })));
const Training = lazy(() => import('./pages/Training').then((m) => ({ default: m.Training })));
const Reports = lazy(() => import('./pages/Reports').then((m) => ({ default: m.Reports })));
const Notifications = lazy(() => import('./pages/Notifications').then((m) => ({ default: m.Notifications })));
const ProfilePage = lazy(() => import('./pages/Profile').then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/Settings').then((m) => ({ default: m.SettingsPage })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));
const Unauthorized = lazy(() => import('./pages/Unauthorized').then((m) => ({ default: m.Unauthorized })));
const UsersPage = lazy(() => import('./pages/Users').then((m) => ({ default: m.UsersPage })));
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Module } from './config/rbac';

const queryClient = new QueryClient();

const PageFallback: React.FC = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Authenticated User Verification Wrapper
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
          path="/placements"
          element={
            <ProtectedRoute module={Module.PLACEMENTS}>
              <Offers />
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
            <ProtectedRoute module={Module.MESSAGES}>
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
            <Suspense fallback={<PageFallback />}>
              <AppContent />
            </Suspense>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
