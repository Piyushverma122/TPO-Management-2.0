import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileText,
  MessageSquare,
  Award,
  FileCheck,
  GraduationCap,
  BarChart3,
  Bell,
  UserCheck,
  Settings,
  User,
} from 'lucide-react';
import { Module, Role, RoleType, canAccessModule, normalizeRole } from './rbac';

export interface SidebarNavItem {
  id: string;
  title: string;
  route: string;
  icon: React.ElementType;
  module: Module;
  badge?: string;
  roleTitles?: Partial<Record<Role, string>>;
  children?: SidebarNavItem[];
}

/**
 * Centralized Sidebar Configuration
 * Each menu item is strictly linked to a Module enum from rbac.ts.
 */
export const MASTER_SIDEBAR_CONFIG: SidebarNavItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    route: '/dashboard',
    icon: LayoutDashboard,
    module: Module.DASHBOARD,
  },
  {
    id: 'students',
    title: 'Students',
    route: '/students',
    icon: Users,
    module: Module.STUDENTS,
  },
  {
    id: 'companies',
    title: 'Companies',
    route: '/companies',
    icon: Building2,
    module: Module.COMPANIES,
    roleTitles: {
      [Role.RECRUITER]: 'My Company',
    },
  },
  {
    id: 'drives',
    title: 'Placement Drives',
    route: '/drives',
    icon: Briefcase,
    module: Module.PLACEMENT_DRIVES,
    roleTitles: {
      [Role.STUDENT]: 'Available Drives',
      [Role.RECRUITER]: 'My Drives',
    },
  },
  {
    id: 'applications',
    title: 'Applications',
    route: '/applications',
    icon: FileText,
    module: Module.APPLICATIONS,
    roleTitles: {
      [Role.STUDENT]: 'My Applications',
      [Role.RECRUITER]: 'Applicants',
    },
  },
  {
    id: 'interviews',
    title: 'Interviews',
    route: '/interviews',
    icon: MessageSquare,
    module: Module.INTERVIEWS,
  },
  {
    id: 'placements',
    title: 'Placements',
    route: '/placements',
    icon: Award,
    module: Module.PLACEMENTS,
  },
  {
    id: 'offers',
    title: 'Offer Letters',
    route: '/offers',
    icon: FileCheck,
    module: Module.OFFER_LETTERS,
    roleTitles: {
      [Role.STUDENT]: 'Offers',
      [Role.RECRUITER]: 'Offers',
    },
  },
  {
    id: 'training',
    title: 'Training',
    route: '/training',
    icon: GraduationCap,
    module: Module.TRAINING,
  },
  {
    id: 'reports',
    title: 'Reports',
    route: '/reports',
    icon: BarChart3,
    module: Module.REPORTS,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    route: '/notifications',
    icon: Bell,
    module: Module.NOTIFICATIONS,
    badge: '5',
  },
  {
    id: 'users',
    title: 'Users',
    route: '/users',
    icon: UserCheck,
    module: Module.USERS,
  },
  {
    id: 'settings',
    title: 'Settings',
    route: '/settings',
    icon: Settings,
    module: Module.SETTINGS,
  },
  {
    id: 'profile',
    title: 'Profile',
    route: '/profile',
    icon: User,
    module: Module.PROFILE,
  },
];

/**
 * Dynamically filter sidebar items based on the user's role and module permissions.
 * Implements nested menu filtering:
 * - Hides child if canAccessModule returns false.
 * - Hides parent if all children are hidden.
 */
export const getDynamicSidebar = (userRole?: RoleType | null): SidebarNavItem[] => {
  const normalizedRole = normalizeRole(userRole);

  const filterNavItem = (item: SidebarNavItem): SidebarNavItem | null => {
    // 1. Process nested child items if present
    if (item.children && item.children.length > 0) {
      const activeChildren = item.children
        .map((child) => filterNavItem(child))
        .filter((child): child is SidebarNavItem => child !== null);

      // Hide parent if all children are hidden
      if (activeChildren.length === 0) {
        return null;
      }

      const roleTitle = item.roleTitles?.[normalizedRole] || item.title;

      return {
        ...item,
        title: roleTitle,
        children: activeChildren,
      };
    }

    // 2. Check permission for single menu item using canAccessModule
    if (!canAccessModule(normalizedRole, item.module)) {
      return null;
    }

    const roleTitle = item.roleTitles?.[normalizedRole] || item.title;

    return {
      ...item,
      title: roleTitle,
    };
  };

  return MASTER_SIDEBAR_CONFIG.map((item) => filterNavItem(item)).filter(
    (item): item is SidebarNavItem => item !== null
  );
};
