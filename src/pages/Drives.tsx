import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Role, normalizeRole } from '../config/rbac';
import { StudentDrives } from '../components/drives/StudentDrives';
import { ManageDrives } from '../components/drives/ManageDrives';

/**
 * Students browse published drives and apply. TPO/admin review and publish drives;
 * recruiters create drives for their own company (the API scopes them).
 */
export const Drives: React.FC = () => {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  return role === Role.STUDENT || role === Role.FACULTY ? <StudentDrives /> : <ManageDrives />;
};
