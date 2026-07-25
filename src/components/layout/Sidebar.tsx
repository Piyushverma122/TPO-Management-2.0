import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileText,
  Award,
  FileCheck,
  MessageSquare,
  Send,
  GraduationCap,
  BarChart3,
  Bell,
  User,
  Settings,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface SidebarItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: SidebarItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Students', path: '/students', icon: Users },
  { name: 'Companies', path: '/companies', icon: Building2 },
  { name: 'Placement Drives', path: '/drives', icon: Briefcase },
  { name: 'Applications', path: '/applications', icon: FileText },
  { name: 'Eligibility', path: '/eligibility', icon: Award },
  { name: 'Resume Repository', path: '/resumes', icon: FileCheck },
  { name: 'Mock Interviews', path: '/interviews', icon: MessageSquare },
  { name: 'Messages', path: '/messages', icon: Send, badge: '3' },
  { name: 'Training', path: '/training', icon: GraduationCap },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Notifications', path: '/notifications', icon: Bell, badge: '5' },
  { name: 'User Profile', path: '/profile', icon: User },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-[#101726] border-r border-[#202D42] h-screen flex flex-col justify-between shrink-0 sticky top-0 z-30 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3 border-b border-[#202D42]">
          <div className="w-9 h-9 rounded-xl bg-[#A3E635] text-[#0B0F17] flex items-center justify-center font-extrabold text-xl shadow-[0_0_15px_rgba(163,230,53,0.5)]">
            S
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white leading-tight tracking-wide">
              Smart Placement
            </h1>
            <p className="text-xs text-[#A3E635] font-semibold">& TPO Portal</p>
          </div>
        </div>

        {/* Nav Links List */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#162032] text-[#A3E635] border border-[#A3E635]/40 shadow-[0_0_15px_rgba(163,230,53,0.15)]'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#162032]/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="bg-[#A3E635] text-[#0B0F17] text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(163,230,53,0.4)]">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile Footer & Logout */}
      <div className="p-4 border-t border-[#202D42] bg-[#0B0F17]/50 space-y-2">
        <div className="flex items-center justify-between">
          <NavLink to="/profile" className="flex items-center gap-2.5 overflow-hidden group">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'}
              alt={user?.name}
              className="w-9 h-9 rounded-full object-cover border border-[#A3E635] group-hover:scale-105 transition-transform"
            />
            <div className="truncate">
              <p className="text-xs font-bold text-white group-hover:text-[#A3E635] transition-colors truncate">
                {user?.name || 'Dr. James Anderson'}
              </p>
              <p className="text-[10px] text-[#A3E635] font-semibold capitalize truncate">
                {user?.role?.replace('_', ' ') || 'TPO Admin'}
              </p>
            </div>
          </NavLink>
          <button
            onClick={logout}
            title="Log Out"
            className="text-[#94A3B8] hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
