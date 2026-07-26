import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RoleType, hasRole } from '../../config/rbac';

export interface RoleProtectedRouteProps {
  allowedRoles: RoleType | RoleType[];
  children?: React.ReactNode;
}

/**
 * Role-based Protected Route Component
 * Validates authentication status and checks if the user's role matches required role(s).
 */
export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
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

  // 3. Check role access via RBAC hasRole utility
  const isRoleAllowed = hasRole(user?.role, allowedRoles);

  if (!isRoleAllowed) {
    return <Navigate to="/403" replace />;
  }

  // 4. Render children or nested router Outlet
  return children ? <>{children}</> : <Outlet />;
};

export default RoleProtectedRoute;
