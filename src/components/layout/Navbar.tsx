import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, Lock, Smartphone, Bell, Plus, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

export interface NavbarProps {
  onQuickAdd?: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onQuickAdd, onToggleSidebar }) => {
  const { user } = useAuth();
  const { info } = useToast();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/students?search=${encodeURIComponent(searchValue.trim())}`);
      info('Global Search', `Searching for "${searchValue.trim()}"`);
    }
  };

  return (
    <header className="h-16 bg-[#101726]/80 backdrop-blur-xl border-b border-[#202D42] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Drawer Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-[#94A3B8] hover:text-white rounded-xl hover:bg-[#162032] border border-[#202D42] transition-colors"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-48 sm:w-80 md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Global Search (Drive, Student, Company...)"
            aria-label="Global Search"
            className="w-full bg-[#162032] border border-[#202D42] focus:border-[#A3E635] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none transition-all duration-200"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Add Button */}
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={onQuickAdd}
          className="font-bold text-xs shrink-0"
        >
          <span className="hidden sm:inline">Quick Add: Drive/Student</span>
          <span className="sm:hidden">+ Quick Add</span>
        </Button>

        {/* Utility Icon Group */}
        <div className="hidden md:flex items-center gap-1 bg-[#162032] border border-[#202D42] rounded-xl p-1">
          <button
            type="button"
            onClick={() => info('Language Selector', 'English (US) selected.')}
            className="p-2 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#202D42] transition-colors"
            title="Language"
            aria-label="Change language"
          >
            <Globe className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => info('Security Portal', 'Portal role: TPO Admin (Active Session)')}
            className="p-2 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#202D42] transition-colors"
            title="Security & Permissions"
            aria-label="View security settings"
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => info('Mobile App Sync', 'TPO Mobile Companion App version 2.4.1')}
            className="p-2 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#202D42] transition-colors"
            title="Mobile App Link"
            aria-label="Mobile companion app link"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Notification Bell Badge */}
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="relative p-2.5 bg-[#162032] border border-[#202D42] text-[#94A3B8] hover:text-[#A3E635] hover:border-[#A3E635]/40 rounded-xl transition-all"
          title="Notifications"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#A3E635] text-[#0B0F17] text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(163,230,53,0.5)]">
            3
          </span>
        </button>

        {/* User Pill Dropdown */}
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 bg-[#162032] border border-[#202D42] hover:border-[#A3E635]/40 px-3 py-1.5 rounded-xl cursor-pointer transition-all text-left"
          aria-label="User profile menu"
        >
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'}
            alt="User avatar"
            className="w-7 h-7 rounded-full object-cover border border-[#A3E635]"
          />
          <span className="text-xs font-bold text-white hidden sm:inline">{user?.name || 'Dr. James Anderson'}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] hidden sm:inline" />
        </button>
      </div>
    </header>
  );
};
