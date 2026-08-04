import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Module, canAccessModule } from '../../config/rbac';

export interface ProtectedRouteProps {
  module: Module;
  children?: React.ReactNode;
}

/**
 * Module-based Protected Route Component
 * Validates authentication status and checks module view permission using RBAC configuration.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ module, children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // 1. Render loading spinner while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#A3E635] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 2. Redirect unauthenticated users to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. Allow temporary access to Settings for first-login password change
  if (module === Module.SETTINGS && user?.must_change_password) {
    return children ? <>{children}</> : <Outlet />;
  }

  // 4. Check module access permissions via RBAC configuration
  const hasModuleAccess = canAccessModule(user?.role, module);

  if (!hasModuleAccess) {
    return <Navigate to="/403" replace />;
  }

  // 5. Render children or nested router Outlet
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
