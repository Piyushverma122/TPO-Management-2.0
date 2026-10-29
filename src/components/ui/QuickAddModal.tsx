import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Building2, Users, type LucideIcon } from 'lucide-react';
import { Modal } from './Modal';
import { useAuth } from '../../context/AuthContext';
import { Action, Module, canPerformAction } from '../../config/rbac';

export interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuickAddShortcut {
  label: string;
  description: string;
  route: string;
  icon: LucideIcon;
  module: Module;
}

const SHORTCUTS: QuickAddShortcut[] = [
  {
    label: 'Placement Drive',
    description: 'Open placement drives to schedule a new recruitment drive.',
    route: '/drives',
    icon: Briefcase,
    module: Module.PLACEMENT_DRIVES,
  },
  {
    label: 'Company',
    description: 'Register a new recruiting company.',
    route: '/companies/add',
    icon: Building2,
    module: Module.COMPANIES,
  },
  {
    label: 'Student',
    description: 'Open the student roster to enrol a candidate.',
    route: '/students',
    icon: Users,
    module: Module.STUDENTS,
  },
];

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const allowed = SHORTCUTS.filter((s) => canPerformAction(user?.role, s.module, Action.CREATE));

  const go = (route: string) => {
    onClose();
    navigate(route);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Add"
      subtitle="Jump straight to the page where you can create a new record."
    >
      <div className="space-y-2">
        {allowed.length === 0 ? (
          <p className="text-sm text-[#94A3B8]">Your role cannot create new records.</p>
        ) : (
          allowed.map(({ label, description, route, icon: Icon }) => (
            <button
              key={route}
              type="button"
              onClick={() => go(route)}
              className="w-full flex items-center gap-3 text-left bg-[#101726] border border-[#202D42] hover:border-[#A3E635]/50 rounded-xl p-3 transition-colors"
            >
              <span className="w-9 h-9 rounded-lg bg-[#A3E635]/15 text-[#A3E635] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <span>
                <span className="block text-sm font-bold text-white">{label}</span>
                <span className="block text-xs text-[#94A3B8]">{description}</span>
              </span>
            </button>
          ))
        )}
      </div>
    </Modal>
  );
};
