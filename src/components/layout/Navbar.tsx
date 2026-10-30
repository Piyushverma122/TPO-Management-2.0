import React, { useState, useEffect } from 'react';
import { Avatar } from '../app/Avatar';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, Lock, Smartphone, Bell, Plus, ChevronDown, Menu, LayoutGrid, User, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../app/Button';
import { useToast } from '../app/Toast';
import { getNotifications } from '../../api/notification.api';
import { Input as ShadInput } from '@/components/ui/input';
import { applyTheme, getStoredTheme, type ThemeMode } from '@/lib/theme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface NavbarProps {
  onQuickAdd?: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onQuickAdd, onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { info } = useToast();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme());

  useEffect(() => {
    const sync = (e: Event) => setTheme((e as CustomEvent<ThemeMode>).detail);
    window.addEventListener('tpo-theme-change', sync);
    return () => window.removeEventListener('tpo-theme-change', sync);
  }, []);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await getNotifications({ is_read: false });
        const count = res.data?.unreadCount ?? (res.data?.notifications?.length || 0);
        setUnreadCount(count);
      } catch (e) {
        setUnreadCount(0);
      }
    };
    fetchUnreadCount();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/students?search=${encodeURIComponent(searchValue.trim())}`);
      info('Global Search', `Searching for "${searchValue.trim()}"`);
    }
  };

  const iconBtn =
    'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Mobile Hamburger Drawer Toggle */}
        <button type="button" onClick={onToggleSidebar} className={`${iconBtn} lg:hidden`} aria-label="Toggle navigation drawer">
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <ShadInput
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search drives, students, companies..."
            aria-label="Global Search"
            className="h-10 w-full rounded-full border-transparent bg-secondary pl-11 pr-4 text-sm dark:bg-secondary"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={onQuickAdd}
          className="h-10 shrink-0 px-4 text-xs"
        >
          <span className="hidden sm:inline">Quick add</span>
        </Button>

        {/* Utilities menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={`${iconBtn} hidden md:flex`} aria-label="More options" title="More">
              <LayoutGrid className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Quick tools</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => info('Language Selector', 'English (US) selected.')}>
              <Globe className="w-4 h-4" /> Language
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => info('Security Portal', 'Portal role: TPO Admin (Active Session)')}>
              <Lock className="w-4 h-4" /> Security & permissions
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => info('Mobile App Sync', 'TPO Mobile Companion App version 2.4.1')}>
              <Smartphone className="w-4 h-4" /> Mobile companion app
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={() => applyTheme(theme === 'dark' ? 'light' : 'dark')}
          className={iconBtn}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell Badge */}
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className={iconBtn}
          title="Notifications"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-10 shrink-0 cursor-pointer items-center gap-2.5 rounded-full pl-1 pr-3 transition-colors hover:bg-secondary"
              aria-label="User menu"
            >
              <Avatar src={user?.avatar} name={user?.name} size="sm" />
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-medium leading-tight text-foreground">{user?.name || 'Admin'}</span>
                <span className="block text-[10px] capitalize leading-tight text-muted-foreground">
                  {user?.role?.replace('_', ' ') || 'admin'}
                </span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl">
            <DropdownMenuLabel>
              <span className="block text-sm font-medium">{user?.name || 'Admin'}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="w-4 h-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-400 focus:text-red-400">
              <LogOut className="w-4 h-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
