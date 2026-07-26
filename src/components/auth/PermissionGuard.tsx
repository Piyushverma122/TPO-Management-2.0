import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ModuleType, ActionType, canPerformAction } from '../../config/rbac';

export interface PermissionGuardProps {
  module: ModuleType;
  action: ActionType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Action-Level Permission Guard Component
 * Evaluates whether the currently logged-in user's role can perform a specific action
 * on a given module using the centralized RBAC configuration.
 * Hides children completely if permission is false.
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  module,
  action,
  children,
  fallback = null,
}) => {
  const { user } = useAuth();
  const isAllowed = canPerformAction(user?.role, module, action);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGuard;
