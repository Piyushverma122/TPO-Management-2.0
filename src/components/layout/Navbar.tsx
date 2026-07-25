import React from 'react';
import { Search, Globe, Lock, Smartphone, Bell, Plus, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export interface NavbarProps {
  onQuickAdd?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onQuickAdd }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-[#101726]/80 backdrop-blur-xl border-b border-[#202D42] px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input */}
      <div className="relative w-72 sm:w-96">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
        <input
          type="text"
          placeholder="Global Search (Drive, Student, Company...)"
          className="w-full bg-[#162032] border border-[#202D42] focus:border-[#A3E635] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none transition-all duration-200"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Add Button */}
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={onQuickAdd}
          className="font-bold text-xs"
        >
          Quick Add: Drive/Student
        </Button>

        {/* Action Icon Buttons */}
        <div className="hidden md:flex items-center gap-1 bg-[#162032] border border-[#202D42] rounded-xl p-1">
          <button className="p-2 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#202D42] transition-colors" title="Language">
            <Globe className="w-4 h-4" />
          </button>
          <button className="p-2 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#202D42] transition-colors" title="Security & Permissions">
            <Lock className="w-4 h-4" />
          </button>
          <button className="p-2 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#202D42] transition-colors" title="Mobile App Link">
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Notification Bell Badge */}
        <button
          className="relative p-2.5 bg-[#162032] border border-[#202D42] text-[#94A3B8] hover:text-[#A3E635] hover:border-[#A3E635]/40 rounded-xl transition-all"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#A3E635] text-[#0B0F17] text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(163,230,53,0.5)]">
            3
          </span>
        </button>

        {/* User Pill Dropdown */}
        <div className="flex items-center gap-2 bg-[#162032] border border-[#202D42] hover:border-[#A3E635]/40 px-3 py-1.5 rounded-xl cursor-pointer transition-all">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'}
            alt="User"
            className="w-7 h-7 rounded-full object-cover border border-[#A3E635]"
          />
          <span className="text-xs font-bold text-white hidden sm:inline">{user?.name || 'Dr. James Anderson'}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
        </div>
      </div>
    </header>
  );
};
