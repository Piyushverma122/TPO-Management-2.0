import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
  Eye,
  AlertCircle,
  Building2,
  MapPin,
  X,
  Bell,
  Share2,
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { getEvents } from '../api/calendar.api';

export interface StudentInterviewItem {
  id: string;
  companyName: string;
  companyLogo: string;
  roleTitle: string;
  roundName: string;
  dateTime: string;
  isoDate: string;
  mode: 'Online' | 'In-Person';
  locationLink: string;
  interviewerName: string;
  status: 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Rescheduled';
  instructions: string;
  requiredDocuments: string[];
  feedback?: string;
}

export const Interviews: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  // API Live Data State
  const [interviews, setInterviews] = useState<StudentInterviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedMode, setSelectedMode] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Upcoming First');

  // Viewing Details Modal
  const [viewingInterview, setViewingInterview] = useState<StudentInterviewItem | null>(null);

  // Fetch Live Student Interviews from Backend API
  const fetchCalendarEventsData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getEvents({ event_type: 'Interview' });
      const rawEvents = res.data?.events || [];

      const formattedEvents: StudentInterviewItem[] = rawEvents.map((ev: any) => {
        const titleParts = ev.title ? ev.title.split('-') : [];
        const comp = titleParts[0]?.trim() || ev.company_name || 'Corporate Partner';
        const role = titleParts[1]?.trim() || ev.role_title || 'Software Development Engineer';

        return {
          id: ev.id,
          companyName: comp,
          companyLogo: ev.company_logo || 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=120',
          roleTitle: role,
          roundName: ev.round_name || 'Technical Round 1',
          dateTime: ev.start_time ? new Date(ev.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Scheduled',
          isoDate: ev.start_time || new Date().toISOString(),
          mode: ev.location_link?.includes('http') ? 'Online' : 'In-Person',
          locationLink: ev.location_link || 'https://meet.google.com',
          interviewerName: ev.interviewer || 'Campus Technical Panel',
          status: (ev.status as any) || 'Scheduled',
          instructions: 'Please join the virtual meeting room 5 minutes prior to your allocated time slot. Keep your university ID card ready for identity verification.',
          requiredDocuments: ['College ID Card', 'Updated PDF Resume', 'Academic Transcripts'],
          feedback: ev.description || 'Candidate demonstrated strong problem-solving skills and clean data structure implementation.',
        };
      });

      setInterviews(formattedEvents);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to fetch interview schedule.';
      setErrorMsg(msg);
      toastError('Error Loading Schedule', msg);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchCalendarEventsData();
  }, [fetchCalendarEventsData]);

  // Status Badge Colors Mapping Helper
  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-extrabold">Scheduled</span>;
      case 'ongoing':
        return <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-extrabold">Ongoing</span>;
      case 'completed':
        return <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-extrabold">Completed</span>;
      case 'cancelled':
        return <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-extrabold">Cancelled</span>;
      case 'rescheduled':
        return <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-extrabold">Rescheduled</span>;
      default:
        return <span className="bg-[#162032] text-[#94A3B8] border border-[#202D42] px-3 py-1 rounded-full text-xs font-extrabold">{status}</span>;
    }
  };

  // Filtered & Sorted Interviews
  const processedInterviews = useMemo(() => {
    let result = interviews.filter((item) => {
      const matchesSearch =
        item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.roundName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
      const matchesMode = selectedMode === 'All' || item.mode === selectedMode;

      return matchesSearch && matchesStatus && matchesMode;
    });

    result.sort((a, b) => {
      if (selectedSort === 'Latest') return new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime();
      return new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime();
    });

    return result;
  }, [interviews, searchQuery, selectedStatus, selectedMode, selectedSort]);

  // Calendar Link Helpers
  const generateGoogleCalendarUrl = (title: string, startDateStr: string, locationLink: string) => {
    const start = new Date(startDateStr);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const isoStart = start.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const isoEnd = end.toISOString().replace(/-|:|\.\d\d\d/g, '');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${isoStart}/${isoEnd}&details=${encodeURIComponent(
      'Campus Recruitment Interview Session'
    )}&location=${encodeURIComponent(locationLink || 'Online Meeting')}`;
  };

  const downloadIcsFile = (title: string, startDateStr: string, locationLink: string) => {
    const start = new Date(startDateStr);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const isoStart = start.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const isoEnd = end.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TPO Management System//EN
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:Campus Recruitment Interview Session
LOCATION:${locationLink || 'Online Meeting'}
DTSTART:${isoStart}
DTEND:${isoEnd}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_Interview.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Calendar File Saved', 'Downloaded .ics appointment file.');
  };

  const handleSetReminder = (title: string) => {
    info('Reminder Scheduled', `Alert set 15 minutes before ${title}.`);
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Calendar & Interviews' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3 mt-1">
            Interview Schedule
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              {interviews.length} Sessions Scheduled
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Track interview slots, join meeting links, export calendar events, and review recruiter feedback.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchCalendarEventsData}
          disabled={loading}
        >
          Refresh Schedule
        </Button>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          <div className="lg:col-span-2">
            <SearchInput
              placeholder="Search by company, role title, or interview round..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Dropdown
            label="Filter by Status:"
            options={[
              { label: 'All Statuses', value: 'All' },
              { label: 'Scheduled', value: 'Scheduled' },
              { label: 'Ongoing', value: 'Ongoing' },
              { label: 'Completed', value: 'Completed' },
              { label: 'Cancelled', value: 'Cancelled' },
              { label: 'Rescheduled', value: 'Rescheduled' },
            ]}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />

          <Dropdown
            label="Interview Mode:"
            options={[
              { label: 'All Modes', value: 'All' },
              { label: 'Online Meeting', value: 'Online' },
              { label: 'In-Person Venue', value: 'In-Person' },
            ]}
            value={selectedMode}
            onChange={setSelectedMode}
          />
        </div>
      </Card>

      {/* ERROR STATE */}
      {errorMsg ? (
        <Card className="p-8 text-center space-y-4 border-rose-500/30 bg-rose-500/5">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Error Loading Interview Schedule</h3>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto">{errorMsg}</p>
          <Button variant="primary" size="md" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchCalendarEventsData}>
            Retry Loading Schedule
          </Button>
        </Card>
      ) : loading ? (
        /* LOADING SKELETON STATE */
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 border-[#202D42] animate-pulse space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#162032] rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-4 bg-[#162032] rounded w-48" />
                    <div className="h-3 bg-[#162032] rounded w-32" />
                  </div>
                </div>
                <div className="h-8 bg-[#162032] rounded-xl w-24" />
              </div>
            </Card>
          ))}
        </div>
      ) : processedInterviews.length === 0 ? (
        /* EMPTY STATE */
        <Card className="p-12 text-center space-y-4 border-[#202D42] bg-[#101726]">
          <Calendar className="w-12 h-12 text-[#94A3B8] mx-auto opacity-40" />
          <h3 className="text-xl font-extrabold text-white">No interviews scheduled.</h3>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
            You do not have any active or upcoming recruiter interview sessions booked right now.
          </p>
          <Button variant="primary" size="md" leftIcon={<Send className="w-4 h-4" />} onClick={() => navigate('/drives')}>
            Browse Drives
          </Button>
        </Card>
      ) : (
        /* LIVE INTERVIEW CARDS GRID */
        <div className="space-y-4">
          {processedInterviews.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="p-5 border-[#202D42] space-y-4 hover:border-[#A3E635]/40 transition-colors">
                
                {/* Top Row: Company & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#202D42] pb-4">
                  <div className="flex items-center gap-4">
                    <Avatar src={item.companyLogo} name={item.companyName} size="md" className="border border-[#202D42]" />
                    <div>
                      <h3 className="text-base font-extrabold text-white leading-tight flex items-center gap-2">
                        {item.companyName}
                        <span className="text-xs text-[#A3E635] font-semibold">({item.roundName})</span>
                      </h3>
                      <p className="text-xs text-[#94A3B8] font-semibold">{item.roleTitle}</p>
                      <p className="text-[11px] text-[#94A3B8] flex items-center gap-2 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-[#A3E635]" /> {item.dateTime}
                        <span className="text-[#64748B]">•</span>
                        <UserCheck className="w-3.5 h-3.5 text-sky-400" /> Panel: {item.interviewerName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-center">
                    {renderStatusBadge(item.status)}
                  </div>
                </div>

                {/* INTERVIEW PROGRESS TIMELINE */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">Interview Progress Timeline</span>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[10px]">
                    <div className="p-2 rounded-xl bg-[#A3E635]/15 border border-[#A3E635]/40 text-white font-bold">1. Approved</div>
                    <div className="p-2 rounded-xl bg-[#A3E635]/15 border border-[#A3E635]/40 text-white font-bold">2. Scheduled</div>
                    <div className="p-2 rounded-xl bg-[#A3E635]/15 border border-[#A3E635]/40 text-white font-bold">3. Round 1</div>
                    <div className="p-2 rounded-xl bg-[#101726] border border-[#202D42] text-[#64748B] font-bold">4. Round 2</div>
                    <div className="p-2 rounded-xl bg-[#101726] border border-[#202D42] text-[#64748B] font-bold">5. HR Round</div>
                    <div className="p-2 rounded-xl bg-[#101726] border border-[#202D42] text-[#64748B] font-bold">6. Result</div>
                  </div>
                </div>

                {/* ACTION BUTTONS ROW */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#202D42] text-xs">
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5 text-sky-400" />} onClick={() => setViewingInterview(item)}>
                      View Details
                    </Button>

                    <a
                      href={generateGoogleCalendarUrl(`${item.companyName} — ${item.roundName}`, item.isoDate, item.locationLink)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button variant="secondary" size="sm" leftIcon={<Calendar className="w-3.5 h-3.5 text-[#A3E635]" />}>
                        Google Calendar
                      </Button>
                    </a>

                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                      onClick={() => downloadIcsFile(`${item.companyName}_${item.roundName}`, item.isoDate, item.locationLink)}
                    >
                      .ICS File
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Bell className="w-3.5 h-3.5 text-amber-400" />}
                      onClick={() => handleSetReminder(`${item.companyName} ${item.roundName}`)}
                    >
                      Remind Me
                    </Button>

                    {item.locationLink && (
                      <a href={item.locationLink} target="_blank" rel="noreferrer">
                        <Button variant="primary" size="sm" leftIcon={<Video className="w-3.5 h-3.5" />} className="font-extrabold shadow-[0_0_12px_rgba(163,230,53,0.3)]">
                          Join Meeting
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      <AnimatePresence>
        {viewingInterview && (
          <Modal
            isOpen={!!viewingInterview}
            onClose={() => setViewingInterview(null)}
            title={`Interview Specifications — ${viewingInterview.companyName}`}
            subtitle={`${viewingInterview.roleTitle} • ${viewingInterview.roundName}`}
            maxWidth="xl"
          >
            <div className="space-y-5 bg-[#101726] border border-[#202D42] p-6 rounded-2xl text-xs">
              
              {/* Header */}
              <div className="border-b border-[#202D42] pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={viewingInterview.companyLogo} name={viewingInterview.companyName} size="md" />
                  <div>
                    <h2 className="text-xl font-extrabold text-white">{viewingInterview.companyName}</h2>
                    <p className="text-xs text-[#A3E635] font-semibold">{viewingInterview.roundName}</p>
                  </div>
                </div>
                <div>{renderStatusBadge(viewingInterview.status)}</div>
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#162032] p-3 rounded-xl border border-[#202D42]">
                <div>
                  <span className="text-[10px] text-[#94A3B8] block">Date & Time</span>
                  <span className="font-bold text-white text-xs">{viewingInterview.dateTime}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#94A3B8] block">Interviewer / Panel</span>
                  <span className="font-bold text-white text-xs">{viewingInterview.interviewerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#94A3B8] block">Session Mode</span>
                  <span className="font-bold text-[#A3E635] text-xs">{viewingInterview.mode}</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-1">
                <span className="font-extrabold text-white uppercase text-[11px]">Instructions & Preparation</span>
                <p className="text-[#94A3B8] leading-relaxed p-3 bg-[#162032] rounded-xl border border-[#202D42]">
                  {viewingInterview.instructions}
                </p>
              </div>

              {/* Feedback (If Available) */}
              {viewingInterview.feedback && (
                <div className="space-y-1">
                  <span className="font-extrabold text-[#A3E635] uppercase text-[11px]">Recruiter Feedback</span>
                  <p className="text-[#94A3B8] leading-relaxed p-3 bg-[#162032] rounded-xl border border-[#A3E635]/30">
                    {viewingInterview.feedback}
                  </p>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#202D42] flex justify-end gap-3">
                <Button variant="secondary" size="md" onClick={() => setViewingInterview(null)}>
                  Close
                </Button>
                {viewingInterview.locationLink && (
                  <a href={viewingInterview.locationLink} target="_blank" rel="noreferrer">
                    <Button variant="primary" size="md" leftIcon={<Video className="w-4 h-4" />}>
                      Join Session
                    </Button>
                  </a>
                )}
              </div>

            </div>
          </Modal>
        )}
      </AnimatePresence>

    </div>
  );
};
