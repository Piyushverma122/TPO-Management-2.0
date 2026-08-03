import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDynamicSidebar, SidebarNavItem } from '../../config/sidebar';

export interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onCloseMobile }) => {
  const { user, logout } = useAuth();

  // Dynamically filter sidebar configuration based on the logged-in user's role & module access permissions
  const dynamicNavItems: SidebarNavItem[] = getDynamicSidebar(user?.role);

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between select-none">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#202D42] shrink-0">
          <div className="flex items-center gap-3">
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
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#202D42]"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Dynamic Nav Links List */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {dynamicNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={item.id}>
                <NavLink
                  to={item.route}
                  onClick={onCloseMobile}
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
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-[#A3E635] text-[#0B0F17] text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(163,230,53,0.4)]">
                      {item.badge}
                    </span>
                  )}
                </NavLink>

                {/* Render Nested Children if present */}
                {item.children && item.children.length > 0 && (
                  <div className="pl-6 space-y-1 mt-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <NavLink
                          key={child.id}
                          to={child.route}
                          onClick={onCloseMobile}
                          className={({ isActive }) =>
                            `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                              isActive
                                ? 'bg-[#162032] text-[#A3E635]'
                                : 'text-[#94A3B8] hover:text-white hover:bg-[#162032]/40'
                            }`
                          }
                        >
                          <div className="flex items-center gap-2.5">
                            <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{child.title}</span>
                          </div>
                          {child.badge && (
                            <span className="bg-[#A3E635] text-[#0B0F17] text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                              {child.badge}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* User Profile Footer & Logout */}
      <div className="p-4 border-t border-[#202D42] bg-[#0B0F17]/50 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <NavLink to="/profile" onClick={onCloseMobile} className="flex items-center gap-2.5 overflow-hidden group">
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
            aria-label="Log Out"
            className="text-[#94A3B8] hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (visible on lg+) */}
      <aside className="hidden lg:flex w-64 bg-[#101726] border-r border-[#202D42] h-screen flex-col justify-between shrink-0 sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (visible on < lg when isMobileOpen is true) */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-[#0B0F17]/80 backdrop-blur-md"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-64 bg-[#101726] border-r border-[#202D42] h-full shadow-2xl relative z-10"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
