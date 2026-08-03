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

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';
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
    if (lower.includes('drive')) return <Briefcase className="w-5 h-5 text-[#A3E635]" />;
    if (lower.includes('application')) return <FileText className="w-5 h-5 text-[#A3E635]" />;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Notifications' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3 mt-1">
            Notification Center
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              {unreadCount} Unread Alerts
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Stay updated with recruitment drive deadlines, interview call schedules, and offer letters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchNotificationsData}
            disabled={loading}
          >
            Refresh Alerts
          </Button>

          <Button
            variant="secondary"
            size="md"
            leftIcon={<Check className="w-4 h-4 text-[#A3E635]" />}
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            Mark All Read
          </Button>

          <PermissionGuard module={Module.NOTIFICATIONS} action={Action.CREATE}>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Send className="w-4 h-4" />}
              onClick={() => setIsBroadcastModalOpen(true)}
              className="font-extrabold text-xs"
            >
              Broadcast
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <Card className="p-3 relative z-30 bg-[#101726] border-[#202D42] shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full min-w-0">
            <SearchInput
              placeholder="Search notifications by title, content, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto shrink-0">
            <Dropdown
              className="w-full sm:w-44 shrink-0"
              options={[
                { label: 'All Notifications', value: 'All' },
                { label: 'Unread Only', value: 'Unread' },
                { label: 'Read Only', value: 'Read' },
              ]}
              value={selectedReadFilter}
              onChange={setSelectedReadFilter}
            />

            <Dropdown
              className="w-full sm:w-40 shrink-0"
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
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedReadFilter('All');
                  setSelectedPriority('All');
                }}
                className="h-10 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 px-3 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* ERROR STATE */}
      {errorMsg ? (
        <Card className="p-8 text-center space-y-4 border-rose-500/30 bg-rose-500/5">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Error Loading Notifications</h3>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto">{errorMsg}</p>
          <Button variant="primary" size="md" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchNotificationsData}>
            Retry Loading Stream
          </Button>
        </Card>
      ) : loading ? (
        /* LOADING SKELETON STATE */
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5 border-[#202D42] animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#162032] rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#162032] rounded w-48" />
                  <div className="h-3 bg-[#162032] rounded w-3/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : processedNotifications.length === 0 ? (
        /* EMPTY STATE */
        <Card className="p-12 text-center space-y-4 border-[#202D42] bg-[#101726]">
          <Bell className="w-12 h-12 text-[#94A3B8] mx-auto opacity-40" />
          <h3 className="text-xl font-extrabold text-white">No notifications available.</h3>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
            You do not have any new or unread system notifications right now.
          </p>
        </Card>
      ) : (
        /* LIVE NOTIFICATIONS STREAM LIST */
        <div className="space-y-4">
          {processedNotifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                onClick={() => !notif.isRead && handleMarkSingleRead(notif.id)}
                className={`p-5 border transition-all duration-300 relative group cursor-pointer ${
                  notif.isRead
                    ? 'bg-[#101726]/80 border-[#202D42]'
                    : 'bg-[#162032] border-[#A3E635]/40 shadow-[0_0_15px_rgba(163,230,53,0.12)]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  
                  {/* Left: Icon + Text Content */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-11 h-11 rounded-2xl bg-[#101726] border border-[#202D42] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      {renderNotificationIcon(notif.type)}
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-white group-hover:text-[#A3E635] transition-colors">
                          {notif.title}
                        </span>

                        <Badge
                          variant={notif.priority === 'HIGH' ? 'alert' : notif.priority === 'MEDIUM' ? 'warning' : 'neutral'}
                          size="sm"
                        >
                          {notif.priority} Priority
                        </Badge>

                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-ping" title="Unread" />
                        )}
                      </div>

                      <p className="text-xs text-[#94A3B8] leading-relaxed">{notif.message}</p>

                      <div className="flex items-center gap-4 text-[10px] text-[#64748B] pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#64748B]" /> {notif.createdAt}
                        </span>
                        <span>Category: <strong className="text-white">{notif.type}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Open Module & Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    {notif.relatedRoute && (
                      <Button
                        variant="tertiary"
                        size="sm"
                        leftIcon={<ArrowRight className="w-3.5 h-3.5 text-[#A3E635]" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (notif.relatedRoute) navigate(notif.relatedRoute);
                        }}
                      >
                        {notif.actionLabel || 'View Module'}
                      </Button>
                    )}

                    <button
                      onClick={(e) => handleDeleteNotification(notif.id, e)}
                      className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete Notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* FOOTER BAR & PAGINATION */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalRecords / itemsPerPage) || 1}
          onPageChange={setCurrentPage}
          totalEntries={totalRecords}
        />
      </div>

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
