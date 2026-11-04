import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Role, normalizeRole } from '../config/rbac';
import { StudentOffers } from '../components/offers/StudentOffers';
import { ManageOffers } from '../components/offers/ManageOffers';

/**
 * Students answer their own offers; recruiters upload them, and TPO/admin approve and release them
 * (the API scopes recruiters to their own company).
 */
export const Offers: React.FC = () => {
  const { user } = useAuth();
  return normalizeRole(user?.role) === Role.STUDENT ? <StudentOffers /> : <ManageOffers />;
};
