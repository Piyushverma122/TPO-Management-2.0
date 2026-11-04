import React from 'react';
import { Avatar } from '../app/Avatar';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';
import { BrandMark } from '../app/BrandMark';
import { useAuth } from '../../context/AuthContext';
import { getDynamicSidebar, SidebarNavItem } from '../../config/sidebar';

export interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

// Groups the flat role-based nav config into labelled sections.
const SECTIONS: { label: string; ids: string[] }[] = [
  { label: 'Overview', ids: ['dashboard'] },
  { label: 'Recruitment', ids: ['students', 'companies', 'drives', 'applications', 'resumes', 'interviews', 'placements', 'offers'] },
  { label: 'Growth & insights', ids: ['training', 'reports'] },
  { label: 'Communication', ids: ['notifications', 'messages'] },
  { label: 'Account', ids: ['users', 'settings', 'profile'] },
];

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onCloseMobile }) => {
  const { user, logout } = useAuth();

  // Dynamically filter sidebar configuration based on the logged-in user's role & module access permissions
  const dynamicNavItems: SidebarNavItem[] = getDynamicSidebar(user?.role);

  const grouped = SECTIONS.map((section) => ({
    label: section.label,
    items: dynamicNavItems.filter((item) => section.ids.includes(item.id)),
  })).filter((section) => section.items.length > 0);

  // Anything not covered by a section still gets rendered.
  const knownIds = new Set(SECTIONS.flatMap((s) => s.ids));
  const leftovers = dynamicNavItems.filter((item) => !knownIds.has(item.id));
  if (leftovers.length > 0) grouped.push({ label: 'More', items: leftovers });

  const linkClass = (isActive: boolean) =>
    `group flex items-center justify-between gap-3 rounded-full px-3.5 py-2 text-sm transition-colors ${
      isActive
        ? 'bg-primary/15 font-semibold text-primary ring-1 ring-primary/30'
        : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring outline-none'
    }`;

  const sidebarContent = (
    <div className="flex h-full select-none flex-col">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div className="leading-tight">
            <h1 className="text-sm font-semibold text-foreground">Smart Placement</h1>
            <p className="text-xs text-muted-foreground">TPO Portal</p>
          </div>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Grouped nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {grouped.map((section) => (
          <div key={section.label} className="space-y-1">
            <p className="px-3.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              {section.label}
            </p>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <React.Fragment key={item.id}>
                  <NavLink to={item.route} onClick={onCloseMobile} className={({ isActive }) => linkClass(isActive)}>
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.title}
                    </span>
                    {item.badge && (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>

                  {item.children && item.children.length > 0 && (
                    <div className="ml-5 space-y-1 border-l border-border pl-3">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <NavLink
                            key={child.id}
                            to={child.route}
                            onClick={onCloseMobile}
                            className={({ isActive }) => linkClass(isActive).replace('text-sm', 'text-xs')}
                          >
                            <span className="flex items-center gap-2.5">
                              <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                              {child.title}
                            </span>
                            {child.badge && (
                              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
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
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="shrink-0 border-t border-border p-3">
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-secondary/60 p-2">
          <NavLink to="/profile" onClick={onCloseMobile} className="flex min-w-0 items-center gap-2.5">
            <Avatar src={user?.avatar} name={user?.name} size="sm" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-medium text-foreground">{user?.name || 'Admin'}</p>
              <p className="truncate text-[10px] capitalize text-muted-foreground">
                {user?.role?.replace('_', ' ') || 'TPO Admin'}
              </p>
            </div>
          </NavLink>
          <button
            onClick={logout}
            title="Log Out"
            aria-label="Log Out"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (visible on lg+) */}
      <aside className="sticky top-0 z-30 hidden h-screen w-64 shrink-0 border-r border-border bg-background lg:flex lg:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (visible on < lg when isMobileOpen is true) */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/60"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative z-10 h-full w-64 border-r border-border bg-background"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
