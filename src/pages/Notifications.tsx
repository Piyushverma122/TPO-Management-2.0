import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  Calendar,
  Briefcase,
  Users,
  Search,
  Filter,
  ExternalLink,
  Check,
  Sparkles,
  Settings,
  RefreshCw,
  Trash2,
  Send,
  FileText,
  GraduationCap,
  Layers,
  ArrowRight,
  X,
} from 'lucide-react';

import { Card } from '../components/app/Card';
import { Button } from '../components/app/Button';
import { Badge } from '../components/app/Badge';
import { Input, SearchInput } from '../components/app/Input';
import { Dropdown } from '../components/app/Dropdown';
import { Pagination } from '../components/app/Pagination';
import { Modal } from '../components/app/Modal';
import { Avatar } from '../components/app/Avatar';
import { Breadcrumb } from '../components/app/Breadcrumb';
import { useToast } from '../components/app/Toast';
import { useAuth } from '../context/AuthContext';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  broadcastNotification,
} from '../api/notification.api';
import { PermissionGuard } from '../components/auth/PermissionGuard';
import { Module, Action } from '../config/rbac';
import supabase from '../config/supabase';
import { Button as ShadButton } from '@/components/ui/button';
import { Tabs } from '../components/app/Tabs';

export interface StudentNotification {
  id: string;
  type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  relatedRoute?: string;
  actionLabel?: string;
}

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  // API State
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReadFilter, setSelectedReadFilter] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  // Broadcast Modal State (Admin / TPO)
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('all_students');
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  // Fetch Live Notifications for Logged-In Student
  const fetchNotificationsData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getNotifications({
        page: currentPage,
        limit: itemsPerPage,
        category: selectedType !== 'All' ? selectedType : undefined,
      });

      const rawList = res.data?.notifications || [];
      const total = res.data?.total || rawList.length;
      const unread = res.data?.unreadCount || rawList.filter((n: any) => !n.is_read).length;

      const formattedList: StudentNotification[] = rawList.map((n: any) => {
        const typeStr = n.type || n.category || 'General Announcement';
        let route = '/dashboard';
        let actionLbl = 'View Details';

        const lowerType = typeStr.toLowerCase();
        if (lowerType.includes('drive')) {
          route = '/drives';
          actionLbl = 'View Drive';
        } else if (lowerType.includes('application')) {
          route = '/applications';
          actionLbl = 'View Application';
        } else if (lowerType.includes('interview')) {
          route = '/interviews';
          actionLbl = 'View Interview';
        } else if (lowerType.includes('offer')) {
          route = '/offers';
          actionLbl = 'View Offer';
        } else if (lowerType.includes('training') || lowerType.includes('cert')) {
          route = '/training';
          actionLbl = 'View Training';
        }

        return {
          id: n.id,
          type: typeStr,
          priority: n.priority || (lowerType.includes('offer') ? 'HIGH' : 'MEDIUM'),
          title: n.title || 'Notification Alert',
          message: n.message || n.description || '',
          createdAt: n.created_at ? new Date(n.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now',
          isRead: !!n.is_read,
          relatedRoute: route,
          actionLabel: actionLbl,
        };
      });

      setNotifications(formattedList);
      setTotalRecords(total);
      setUnreadCount(unread);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load notifications stream.';
      setErrorMsg(msg);
      toastError('Notifications Error', msg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, selectedType, toastError]);

  useEffect(() => {
    fetchNotificationsData();

    // Supabase Realtime Subscription for Live Notifications
    const channel = supabase
      .channel(`public:notifications:${user?.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload: any) => {
          const newNotif = payload.new;
          if (!newNotif.user_id || newNotif.user_id === user?.id) {
            info('New Alert', newNotif.title || newNotif.message);
            fetchNotificationsData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotificationsData, user, info]);

  // Mark All Notifications as Read
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      success('Notifications Updated', 'Marked all notifications as read.');
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'Failed to mark all as read.');
    }
  };

  // Mark Single Notification as Read
  const handleMarkSingleRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      // Silent error fallback
    }
  };

  // Delete Single Notification
  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      success('Notification Removed', 'Notification alert record deleted.');
    } catch (err: any) {
      toastError('Delete Error', err.response?.data?.message || 'Failed to delete notification.');
    }
  };

  // Processed Filtered & Searched Notifications
  const processedNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      const matchesSearch =
        notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notif.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRead =
        selectedReadFilter === 'All' ||
        (selectedReadFilter === 'Unread' && !notif.isRead) ||
        (selectedReadFilter === 'Read' && notif.isRead);

      const matchesPriority = selectedPriority === 'All' || notif.priority === selectedPriority;

      return matchesSearch && matchesRead && matchesPriority;
    });
  }, [notifications, searchQuery, selectedReadFilter, selectedPriority]);

  // Icon Helper for Notification Types
  const renderNotificationIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('drive')) return <Briefcase className="w-5 h-5 text-primary" />;
    if (lower.includes('application')) return <FileText className="w-5 h-5 text-primary" />;
    if (lower.includes('interview')) return <Calendar className="w-5 h-5 text-sky-400" />;
    if (lower.includes('offer')) return <Award className="w-5 h-5 text-emerald-400" />;
    if (lower.includes('training') || lower.includes('cert')) return <GraduationCap className="w-5 h-5 text-purple-400" />;
    return <Bell className="w-5 h-5 text-amber-400" />;
  };

  // Broadcast Notification Form Submit (For Admin / TPO)
  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) {
      toastError('Validation Error', 'Title and Message are required.');
      return;
    }

    setBroadcastLoading(true);
    try {
      await broadcastNotification({
        title: broadcastTitle,
        message: broadcastMessage,
        target_group: broadcastTarget,
      });

      setIsBroadcastModalOpen(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
      success('Broadcast Sent', 'Notification broadcasted to selected target audience.');
      await fetchNotificationsData();
    } catch (err: any) {
      toastError('Broadcast Error', err.response?.data?.message || 'Failed to send broadcast.');
    } finally {
      setBroadcastLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Notifications' }]} />
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-3">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}. Drive deadlines, interviews and offer letters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="tertiary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchNotificationsData}
            disabled={loading}
            className="text-xs"
          >
            Refresh
          </Button>

          <Button
            variant="tertiary"
            size="md"
            leftIcon={<Check className="w-4 h-4" />}
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="text-xs"
          >
            Mark all read
          </Button>

          <PermissionGuard module={Module.NOTIFICATIONS} action={Action.CREATE}>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Send className="w-4 h-4" />}
              onClick={() => setIsBroadcastModalOpen(true)}
              className="text-xs"
            >
              Broadcast
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* INBOX CARD */}
      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 border-b border-border">
          <Tabs
            variant="neon"
            activeTab={selectedReadFilter}
            onChange={setSelectedReadFilter}
            tabs={[
              { id: 'All', label: 'All' },
              { id: 'Unread', label: 'Unread', count: unreadCount },
              { id: 'Read', label: 'Read' },
            ]}
            className="w-auto shrink-0"
          />

          <div className="flex-1 min-w-0">
            <SearchInput
              placeholder="Search by title, content or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Dropdown
              className="w-full sm:w-44 shrink-0"
              options={[
                { label: 'All Priorities', value: 'All' },
                { label: 'High Priority', value: 'HIGH' },
                { label: 'Medium Priority', value: 'MEDIUM' },
                { label: 'Low Priority', value: 'LOW' },
              ]}
              value={selectedPriority}
              onChange={setSelectedPriority}
            />

            {(selectedReadFilter !== 'All' || selectedPriority !== 'All' || searchQuery !== '') && (
              <ShadButton
                variant="ghost"
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedReadFilter('All');
                  setSelectedPriority('All');
                }}
                className="h-10 rounded-full px-4 text-xs text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </ShadButton>
            )}
          </div>
        </div>

        {/* List */}
        {errorMsg ? (
          <div className="p-12 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-lg font-semibold text-foreground">Error loading notifications</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">{errorMsg}</p>
            <Button variant="primary" size="md" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchNotificationsData}>
              Retry
            </Button>
          </div>
        ) : loading ? (
          <ul className="divide-y divide-border">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center gap-4 p-5 animate-pulse">
                <div className="h-11 w-11 rounded-full bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-secondary" />
                  <div className="h-3 w-3/4 rounded bg-secondary" />
                </div>
              </li>
            ))}
          </ul>
        ) : processedNotifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Bell className="w-6 h-6" />
            </span>
            <h3 className="text-lg font-semibold text-foreground">Nothing here yet</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              New drive alerts, interview schedules and offers will show up in this inbox.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {processedNotifications.map((notif) => (
              <motion.li
                key={notif.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => !notif.isRead && handleMarkSingleRead(notif.id)}
                className={`group flex cursor-pointer items-start gap-4 p-5 transition-colors hover:bg-accent/40 ${
                  notif.isRead ? '' : 'bg-secondary/40'
                }`}
              >
                {/* Unread dot + icon */}
                <div className="relative shrink-0">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-foreground">
                    {renderNotificationIcon(notif.type)}
                  </span>
                  {!notif.isRead && (
                    <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary" title="Unread" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className={`text-sm ${notif.isRead ? 'font-medium text-foreground' : 'font-semibold text-foreground'}`}>
                      {notif.title}
                    </h4>
                    <Badge
                      variant={notif.priority === 'HIGH' ? 'alert' : notif.priority === 'MEDIUM' ? 'warning' : 'neutral'}
                      size="sm"
                    >
                      {notif.priority}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{notif.message}</p>
                  <p className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {notif.createdAt}
                    </span>
                    <span>&middot;</span>
                    <span>{notif.type}</span>
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {notif.relatedRoute && (
                    <Button
                      variant="tertiary"
                      size="sm"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (notif.relatedRoute) navigate(notif.relatedRoute);
                      }}
                    >
                      {notif.actionLabel || 'View'}
                    </Button>
                  )}
                  <button
                    onClick={(e) => handleDeleteNotification(notif.id, e)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-red-400"
                    title="Delete notification"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        <div className="border-t border-border px-4 py-2">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalRecords / itemsPerPage) || 1}
            onPageChange={setCurrentPage}
            totalEntries={totalRecords}
          />
        </div>
      </Card>

      {/* BROADCAST ANNOUNCEMENT MODAL */}
      <Modal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        title="Broadcast System Announcement"
        subtitle="Send high-priority notifications to students or recruiters."
      >
        <form onSubmit={handleBroadcastSubmit} className="space-y-4">
          <Input
            label="Announcement Title"
            placeholder="e.g. Campus Drive Schedule Announcement"
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            required
          />
          <Input
            label="Notification Message Body"
            placeholder="Enter announcement details..."
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setIsBroadcastModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={broadcastLoading}>
              Send Broadcast
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
