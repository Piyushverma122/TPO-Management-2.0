import React, { useState } from 'react';
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
  Settings
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { RadialProgress } from '../components/ui/ProgressBar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';

export interface NotificationItem {
  id: string;
  category: 'Drive Update' | 'Results' | 'Interview' | 'Training' | 'System Alert';
  badgeTag: 'New' | 'Important' | 'Immediate Action' | 'Required';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  actionText?: string;
  avatar?: string;
}

const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    category: 'Drive Update',
    badgeTag: 'New',
    title: 'Amazon SDE-1 Shortlist',
    description: 'Amazon SDE-1 Shortlisted candidate list is now available.',
    timestamp: '1h ago',
    isRead: false,
    actionText: 'View List',
  },
  {
    id: 'notif-[#2]',
    category: 'Results',
    badgeTag: 'Important',
    title: 'Candidate Placement Confirmed',
    description: 'Jamel Mahiral (EE) has been placed at Microsoft with ₹1.0 Cr PA.',
    timestamp: '1h ago',
    isRead: false,
    actionText: 'Congratulate Jamel',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
  },
  {
    id: 'notif-[#3]',
    category: 'Interview',
    badgeTag: 'Immediate Action',
    title: 'Technical Interview Scheduled',
    description: 'Google (technical round) scheduled for tomorrow at 10 AM GST.',
    timestamp: '1h ago',
    isRead: false,
    actionText: 'Join Meeting / Add to Calendar',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
  },
  {
    id: 'notif-4',
    category: 'Training',
    badgeTag: 'Required',
    title: 'Training Module Badge Earned',
    description: 'Core Java completion badge earned by 45 candidates.',
    timestamp: '1h ago',
    isRead: false,
  },
  {
    id: 'notif-5',
    category: 'System Alert',
    badgeTag: 'Required',
    title: 'Profile Incomplete Alert',
    description: 'Profile skill section is incomplete. Please update system record.',
    timestamp: '1h ago',
    isRead: false,
  },
];

export const Notifications: React.FC = () => {
  const { success, info } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifs = notifications.filter((n) => {
    const matchesCat = selectedCategory === 'All' || n.category === selectedCategory;
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    success('Notifications Updated', 'Marked all notifications as read.');
  };

  return (
    <div className="space-y-6 pb-16">
      
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
      </div>

      {/* THREE COLUMN LAYOUT strictly matching Design Notification Center.jpg */}
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
              <span className="text-[#64748B]">10</span>
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
              <span className="text-[#64748B]">5</span>
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
              <span className="text-[#64748B]">3</span>
            </button>

            <button
              onClick={() => setSelectedCategory('Training')}
              className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all ${
                selectedCategory === 'Training'
                  ? 'bg-[#162032] text-[#A3E635] border border-[#A3E635]/40'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#162032]/60'
              }`}
            >
              <span>Training</span>
              <span className="text-[#64748B]">2</span>
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
              <span className="text-[#64748B]">5</span>
            </button>
          </div>
        </Card>

        {/* MIDDLE COLUMN (5 cols): Recent Notifications List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white">Recent Notifications</h2>
            <SearchInput
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-44 py-1 text-xs"
            />
          </div>

          <div className="space-y-4">
            {filteredNotifs.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card glowOnHover className="p-5 space-y-3 border-[#202D42]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">{item.category}</span>
                      <Badge variant={item.badgeTag === 'Important' ? 'warning' : 'active'} size="sm">
                        {item.badgeTag}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-[#64748B] font-bold">{item.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">{item.description}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-[#202D42]">
                    <div className="flex items-center gap-2">
                      {item.avatar && <Avatar src={item.avatar} name={item.title} size="xs" />}
                      <span className="text-[10px] text-[#A3E635] font-bold uppercase">Unread</span>
                    </div>

                    {item.actionText && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => info('Action Clicked', `Triggered ${item.actionText}`)}
                        className="text-xs font-bold py-1 px-3"
                      >
                        {item.actionText}
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN (4 cols): Unread Notifications by Category Gauges strictly matching design */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Radial Gauges Card */}
          <Card className="p-5 space-y-4 bg-[#101726] border-[#202D42]">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Unread Notifications by Category
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <RadialProgress value={80} size={70} strokeWidth={6} label="10 Drive Updates" />
              <RadialProgress value={60} size={70} strokeWidth={6} label="5 Results" />
              <RadialProgress value={40} size={70} strokeWidth={6} label="3 Interviews" />
              <RadialProgress value={30} size={70} strokeWidth={6} label="2 Training" />
            </div>
          </Card>

          {/* Notifications for Key Profiles Card */}
          <Card className="p-5 space-y-3 bg-[#101726] border-[#202D42]">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Notifications for Key Profiles
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#162032] border border-[#202D42]">
                <div className="flex items-center gap-2">
                  <Avatar src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" name="Rahul" size="xs" online />
                  <div>
                    <span className="font-bold text-white text-xs block">Rahul Sharma</span>
                    <span className="text-[10px] text-[#A3E635]">Amazon Offer Letter</span>
                  </div>
                </div>
                <Badge variant="active" size="sm">43</Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#162032] border border-[#202D42]">
                <div className="flex items-center gap-2">
                  <Avatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120" name="Jamel" size="xs" online />
                  <div>
                    <span className="font-bold text-white text-xs block">Jamel Mahiral</span>
                    <span className="text-[10px] text-sky-400">Google Result Out</span>
                  </div>
                </div>
                <Badge variant="info" size="sm">12</Badge>
              </div>
            </div>
          </Card>

        </div>

      </div>

      {/* FOOTER ACTIONS BAR strictly matching Design Notification Center.jpg */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#202D42]">
        <Button variant="secondary" size="md" onClick={() => info('Notification Config', 'Opening notification settings...')}>
          Notification Settings
        </Button>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Check className="w-4 h-4 text-[#0B0F17]" />}
          onClick={handleMarkAllRead}
          className="px-6 font-extrabold shadow-[0_0_15px_rgba(163,230,53,0.3)]"
        >
          Mark All As Read
        </Button>
      </div>

    </div>
  );
};
