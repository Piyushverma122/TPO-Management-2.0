import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Calendar,
  Clock,
  Video,
  Star,
  Plus,
  CheckCircle2,
  FileText,
  UserCheck,
  TrendingUp,
  Download,
  Send,
  Sparkles,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';
import {
  getEvents,
  createEvent,
  deleteEvent,
  getUpcomingEvents,
} from '../api/calendar.api';

// Sparkline Mock Data
const feedbackTrendData = [
  { day: 'Mon', score: 65 },
  { day: 'Tue', score: 45 },
  { day: 'Wed', score: 85 },
  { day: 'Thu', score: 70 },
  { day: 'Fri', score: 92 },
  { day: 'Sat', score: 88 },
];

export interface UpcomingInterview {
  id: string;
  studentName: string;
  studentAvatar: string;
  branch: string;
  role: string;
  interviewerName: string;
  dateTime: string;
  status: 'Confirmed' | 'Completed' | 'Pending';
  joinUrl: string;
}

export interface InterviewFeedback {
  id: string;
  studentName: string;
  studentAvatar: string;
  role: string;
  track: string;
  interviewerName: string;
  summary: string;
  rating: number;
  mockScore: number;
}

export const Interviews: React.FC = () => {
  const { success, error: toastError, info } = useToast();

  // API State
  const [upcoming, setUpcoming] = useState<UpcomingInterview[]>([]);
  const [feedbacks, setFeedbacks] = useState<InterviewFeedback[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Schedule Modal State
  const [scheduleTitle, setScheduleTitle] = useState('SDE Technical Interview');
  const [scheduleStudent, setScheduleStudent] = useState('Rahul Sharma');
  const [scheduleInterviewer, setScheduleInterviewer] = useState('Dr. James Anderson');
  const [scheduleDate, setScheduleDate] = useState('2025-11-05');
  const [scheduleTime, setScheduleTime] = useState('07:00 PM');

  const fetchCalendarEventsData = async () => {
    setLoading(true);
    try {
      const res = await getEvents({ event_type: 'Interview' });
      const rawEvents = res.data?.events || [];

      const formattedEvents: UpcomingInterview[] = rawEvents.map((ev: any) => ({
        id: ev.id,
        studentName: ev.user_name || ev.participants?.[0]?.name || 'Student Candidate',
        studentAvatar: ev.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        branch: ev.branch || 'CS',
        role: ev.title || 'Technical Interview Round',
        interviewerName: ev.interviewer || 'Campus Recruiter',
        dateTime: ev.start_time ? new Date(ev.start_time).toLocaleString() : 'Scheduled',
        status: (ev.status as any) || 'Confirmed',
        joinUrl: ev.location_link || 'https://meet.google.com/abc-defg-hij',
      }));

      setUpcoming(formattedEvents);

      // Default mock feedback items if none returned
      setFeedbacks([
        {
          id: 'fb-1',
          studentName: 'Rahul Sharma',
          studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
          role: 'SDE Role Learning',
          track: 'Python & Data Structures',
          interviewerName: 'Dr. James Anderson',
          summary: 'Exemplary performance in data structures and problem solving. Solid grasp of complexity analysis.',
          rating: 5,
          mockScore: 90,
        },
        {
          id: 'fb-2',
          studentName: 'Priya Patel',
          studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
          role: 'Data Analyst Track',
          track: 'Machine Learning & SQL',
          interviewerName: 'Sarah Jenkins',
          summary: 'Great data modeling skills and Tableau visualization clarity. Recommended for analytics role.',
          rating: 4,
          mockScore: 85,
        },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load calendar events.';
      toastError('Error Loading Events', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarEventsData();
  }, []);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleStudent || !scheduleDate) {
      toastError('Validation Error', 'Candidate Name and Date are required.');
      return;
    }

    try {
      await createEvent({
        title: `${scheduleTitle} - ${scheduleStudent}`,
        event_type: 'Interview',
        start_time: new Date(`${scheduleDate} ${scheduleTime}`).toISOString(),
        location_link: 'https://meet.google.com/new-interview-slot',
      });

      setIsScheduleModalOpen(false);
      success('Mock Interview Scheduled', `Session booked for ${scheduleStudent}.`);
      fetchCalendarEventsData();
    } catch (err: any) {
      toastError('Schedule Error', err.response?.data?.message || 'Failed to schedule event.');
    }
  };

  const handleDeleteEventAction = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      success('Event Removed', 'Calendar event deleted.');
      fetchCalendarEventsData();
    } catch (err: any) {
      toastError('Delete Error', err.response?.data?.message || 'Failed to delete event.');
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Calendar & Events' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-1">
            Calendar & Interview Schedule
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              {upcoming.length} Scheduled Events
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchCalendarEventsData}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsScheduleModalOpen(true)}
            className="font-extrabold text-xs"
          >
            + Schedule Mock Interview
          </Button>
        </div>
      </div>

      {/* TOP SECTION: UPCOMING INTERVIEWS TABLE & PERFORMANCE CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Interviews Table Card (8 cols) */}
        <Card className="lg:col-span-8 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#202D42] pb-3">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#A3E635]" />
              Scheduled Calendar Events & Interviews
            </h2>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Role / Event</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[#94A3B8]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#A3E635] border-t-transparent rounded-full animate-spin" />
                      <span>Loading scheduled calendar events...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : upcoming.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[#94A3B8]">
                    No upcoming calendar events scheduled.
                  </TableCell>
                </TableRow>
              ) : (
                upcoming.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar src={item.studentAvatar} name={item.studentName} size="sm" />
                        <div>
                          <span className="font-bold text-white block text-xs">{item.studentName}</span>
                          <span className="text-[10px] text-[#94A3B8]">{item.branch}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-white text-xs">{item.role}</TableCell>
                    <TableCell className="text-xs text-[#94A3B8]">{item.dateTime}</TableCell>
                    <TableCell>
                      <Badge variant="success" size="sm">
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={item.joinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-[#A3E635]/15 hover:bg-[#A3E635]/25 border border-[#A3E635]/30 text-[#A3E635] rounded-lg text-xs font-bold inline-flex items-center gap-1"
                        >
                          <Video className="w-3 h-3" />
                          Join
                        </a>
                        <button
                          onClick={() => handleDeleteEventAction(item.id)}
                          className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-md"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Performance Radar Card (4 cols) */}
        <Card className="lg:col-span-4 p-5 space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-white border-b border-[#202D42] pb-3">
            Mock Performance Index
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#94A3B8]">Overall Rating Score</span>
              <span className="font-extrabold text-[#A3E635]">4.8 / 5.0</span>
            </div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={feedbackTrendData}>
                  <Area type="monotone" dataKey="score" stroke="#A3E635" fill="#A3E635" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* SCHEDULE MOCK INTERVIEW MODAL */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Event / Interview"
        subtitle="Book a calendar event or 1-on-1 interview slot."
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <Input
            label="Event / Interview Title"
            placeholder="e.g. SDE Technical Interview"
            value={scheduleTitle}
            onChange={(e) => setScheduleTitle(e.target.value)}
            required
          />
          <Input
            label="Candidate Name"
            placeholder="e.g. Rahul Sharma"
            value={scheduleStudent}
            onChange={(e) => setScheduleStudent(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              required
            />
            <Input
              label="Time"
              type="text"
              placeholder="07:00 PM"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Book Event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
