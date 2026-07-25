import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { RadialProgress } from '../components/ui/ProgressBar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  broadcastNotification,
} from '../api/notification.api';

export interface NotificationItem {
  id: string;
  category: string;
  badgeTag: string;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  actionText?: string;
  avatar?: string;
}

export const Notifications: React.FC = () => {
  const { success, error: toastError, info } = useToast();

  // API State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Filters & Modals
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  // Broadcast Form State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('all_students');
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  const fetchNotificationsData = async () => {
    setLoading(true);
    try {
      const res = await getNotifications({
        page: currentPage,
        limit: itemsPerPage,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
      });

      const rawList = res.data?.notifications || [];
      const total = res.data?.total || 0;
      const unread = res.data?.unreadCount || 0;

      const formattedList: NotificationItem[] = rawList.map((n: any) => ({
        id: n.id,
        category: n.category || 'System Alert',
        badgeTag: n.priority === 'HIGH' ? 'Immediate Action' : 'New',
        title: n.title || 'Notification Alert',
        description: n.message || n.description || '',
        timestamp: n.created_at ? new Date(n.created_at).toLocaleTimeString() : 'Just now',
        isRead: !!n.is_read,
        actionText: n.action_url ? 'View Action' : undefined,
      }));

      setNotifications(formattedList);
      setTotalRecords(total);
      setUnreadCount(unread);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load notifications queue.';
      toastError('Error Loading Notifications', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationsData();
  }, [currentPage, selectedCategory]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      success('Notifications Updated', 'Marked all notifications as read.');
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'Failed to mark all as read.');
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err: any) {
      toastError('Error', 'Failed to update notification status.');
    }
  };

  const handleDeleteNotificationAction = async (id: string) => {
    try {
      await deleteNotification(id);
      success('Notification Removed', 'Alert record deleted.');
      fetchNotificationsData();
    } catch (err: any) {
      toastError('Delete Error', err.response?.data?.message || 'Failed to delete notification.');
    }
  };

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

      setBroadcastLoading(false);
      setIsBroadcastModalOpen(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
      success('Broadcast Sent', 'Notification broadcasted to selected target audience.');
      fetchNotificationsData();
    } catch (err: any) {
      setBroadcastLoading(false);
      toastError('Broadcast Error', err.response?.data?.message || 'Failed to send broadcast notification.');
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Notifications' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-1">
            Notification Center
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              {unreadCount} Unread Alerts
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchNotificationsData}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Send className="w-4 h-4" />}
            onClick={() => setIsBroadcastModalOpen(true)}
            className="font-extrabold text-xs"
          >
            Broadcast Announcement
          </Button>
        </div>
      </div>

      {/* THREE COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (3 cols): Notification Filters */}
        <Card className="lg:col-span-3 p-5 space-y-3 bg-[#101726] border-[#202D42]">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-white border-b border-[#202D42] pb-3">
            Notification Filters
          </h2>

          <div className="space-y-1.5 text-xs font-bold">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all ${
                selectedCategory === 'All'
                  ? 'bg-[#162032] text-[#A3E635] border border-[#A3E635]/40 shadow-[0_0_10px_rgba(163,230,53,0.2)]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#162032]/60'
              }`}
            >
              <span>All</span>
              <span className="bg-[#A3E635] text-[#0B0F17] text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                {unreadCount} Unread
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('Drive Update')}
              className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all ${
                selectedCategory === 'Drive Update'
                  ? 'bg-[#162032] text-[#A3E635] border border-[#A3E635]/40'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#162032]/60'
              }`}
            >
              <span>Drive Updates</span>
            </button>

            <button
              onClick={() => setSelectedCategory('Results')}
              className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all ${
                selectedCategory === 'Results'
                  ? 'bg-[#162032] text-[#A3E635] border border-[#A3E635]/40'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#162032]/60'
              }`}
            >
              <span>Results</span>
            </button>

            <button
              onClick={() => setSelectedCategory('Interview')}
              className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all ${
                selectedCategory === 'Interview'
                  ? 'bg-[#162032] text-[#A3E635] border border-[#A3E635]/40'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#162032]/60'
              }`}
            >
              <span>Interviews</span>
            </button>

            <button
              onClick={() => setSelectedCategory('System Alert')}
              className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all ${
                selectedCategory === 'System Alert'
                  ? 'bg-[#162032] text-[#A3E635] border border-[#A3E635]/40'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#162032]/60'
              }`}
            >
              <span>System Alerts</span>
            </button>
          </div>
        </Card>

        {/* MIDDLE COLUMN (6 cols): Notifications Activity Feed */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#94A3B8]">
              Showing {notifications.length} notifications
            </span>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Check className="w-3.5 h-3.5 text-[#A3E635]" />}
              onClick={handleMarkAllRead}
            >
              Mark All as Read
            </Button>
          </div>

          {loading ? (
            <div className="bg-[#162032] border border-[#202D42] rounded-3xl p-12 text-center text-[#94A3B8]">
              <div className="w-8 h-8 border-4 border-[#A3E635] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span>Loading notification stream...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-[#162032] border border-[#202D42] rounded-3xl p-12 text-center text-[#94A3B8]">
              No notifications in queue.
            </div>
          ) : (
            notifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleMarkSingleRead(notif.id)}
                className={`p-4 rounded-2xl border transition-all duration-300 shadow-xl cursor-pointer ${
                  notif.isRead
                    ? 'bg-[#162032]/60 border-[#202D42]'
                    : 'bg-[#162032] border-[#A3E635]/40 shadow-[0_0_15px_rgba(163,230,53,0.1)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#A3E635]/15 text-[#A3E635] flex items-center justify-center font-bold shrink-0 mt-0.5">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={notif.badgeTag === 'Immediate Action' ? 'alert' : 'accent'} size="sm">
                          {notif.badgeTag}
                        </Badge>
                        <span className="text-[10px] text-[#64748B] font-semibold">{notif.timestamp}</span>
                      </div>
                      <h4 className="text-sm font-extrabold text-white mt-1">{notif.title}</h4>
                      <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">{notif.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotificationAction(notif.id);
                    }}
                    className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg shrink-0"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* RIGHT COLUMN (3 cols): System Status & Unread Counter */}
        <Card className="lg:col-span-3 p-5 space-y-4 bg-[#101726] border-[#202D42]">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-white border-b border-[#202D42] pb-3">
            Alert Center Status
          </h2>

          <div className="bg-[#162032] border border-[#202D42] rounded-xl p-4 text-center space-y-2">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Unread Notifications</span>
            <span className="text-3xl font-extrabold text-[#A3E635]">{unreadCount}</span>
            <span className="text-[11px] text-[#94A3B8] block">Out of {totalRecords} total alerts</span>
          </div>
        </Card>
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
            placeholder="e.g. Schedule Update / Campus Visit"
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            required
          />
          <Input
            label="Notification Message"
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
