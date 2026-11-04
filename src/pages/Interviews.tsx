import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Role, normalizeRole } from '../config/rbac';
import { StudentInterviews } from '../components/interviews/StudentInterviews';
import { ManageInterviews } from '../components/interviews/ManageInterviews';

/**
 * Students see their own interview schedule; recruiters, TPO and admin manage interviews
 * (the API scopes recruiters to their own company).
 */
export const Interviews: React.FC = () => {
  const { user } = useAuth();
  return normalizeRole(user?.role) === Role.STUDENT ? <StudentInterviews /> : <ManageInterviews />;
};
