import React, { useState } from 'react';
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
  ChevronRight
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
  rating: number; // 1 to 5 stars
  mockScore: number;
}

const initialUpcoming: UpcomingInterview[] = [
  {
    id: 'up-1',
    studentName: 'Ervara Mahiral',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    branch: 'CS',
    role: 'SDE Intern',
    interviewerName: 'Dr. James Anderson',
    dateTime: 'Today, 07:00 PM',
    status: 'Confirmed',
    joinUrl: 'https://meet.google.com/abc-defg-hij',
  },
  {
    id: 'up-2',
    studentName: 'Jamel Mahiral',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    branch: 'IT',
    role: 'Data Analyst',
    interviewerName: 'Sarah Jenkins',
    dateTime: 'Tomorrow, 05:00 PM',
    status: 'Confirmed',
    joinUrl: 'https://meet.google.com/xyz-uvwx-rst',
  },
  {
    id: 'up-3',
    studentName: 'Liam Hayes',
    studentAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=120',
    branch: 'EE',
    role: 'Hardware Role',
    interviewerName: 'Michael Chang',
    dateTime: 'Oct 28, 07:30 PM',
    status: 'Confirmed',
    joinUrl: 'https://meet.google.com/lmn-opqr-stu',
  },
  {
    id: 'up-4',
    studentName: 'Aanya Patel',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    branch: 'CS',
    role: 'Frontend Dev',
    interviewerName: 'Pooja Hegde',
    dateTime: 'Oct 29, 06:00 PM',
    status: 'Confirmed',
    joinUrl: 'https://meet.google.com/qrs-tuvw-xyz',
  },
];

const initialFeedbacks: InterviewFeedback[] = [
  {
    id: 'fb-1',
    studentName: 'Ervara Mahiral',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    role: 'SDE Role Learning',
    track: 'Python & Data Structures',
    interviewerName: 'Dr. James Anderson',
    summary:
      'Exemplary performance in data structures and problem solving. Solid grasp of complexity analysis. Recommended for tier-1 SDE roles.',
    rating: 5,
    mockScore: 90,
  },
  {
    id: 'fb-2',
    studentName: 'Jamel Mahiral',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    role: 'Data Analyst Track',
    track: 'Machine Learning & SQL',
    interviewerName: 'Sarah Jenkins',
    summary:
      'Great data modeling skills and Tableau visualization clarity. Needs minor practice on complex SQL joins and scenario questions.',
    rating: 4,
    mockScore: 79,
  },
];

export const Interviews: React.FC = () => {
  const { success, info } = useToast();
  const [upcoming, setUpcoming] = useState<UpcomingInterview[]>(initialUpcoming);
  const [feedbacks, setFeedbacks] = useState<InterviewFeedback[]>(initialFeedbacks);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Schedule Modal State
  const [scheduleStudent, setScheduleStudent] = useState('Rahul Sharma');
  const [scheduleInterviewer, setScheduleInterviewer] = useState('Dr. James Anderson');
  const [scheduleDate, setScheduleDate] = useState('2025-11-05');
  const [scheduleTime, setScheduleTime] = useState('07:00 PM');

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newInterview: UpcomingInterview = {
      id: `up-${Date.now()}`,
      studentName: scheduleStudent,
      studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
      branch: 'CS',
      role: 'SDE Mock Round',
      interviewerName: scheduleInterviewer,
      dateTime: `${scheduleDate}, ${scheduleTime}`,
      status: 'Confirmed',
      joinUrl: 'https://meet.google.com/new-interview-slot',
    };

    setUpcoming([newInterview, ...upcoming]);
    setIsScheduleModalOpen(false);
    success('Mock Interview Scheduled', `Session booked for ${scheduleStudent} with ${scheduleInterviewer}.`);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Mock Interviews' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-1">
            Mock Interviews & Practice Module
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              Live Mentorship
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Technical 1-on-1 mock evaluations, interviewer feedback, star ratings, and performance radar.
          </p>
        </div>

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

      {/* TOP SECTION: UPCOMING INTERVIEWS TABLE & PERFORMANCE CHARTS strictly matching design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Upcoming Interviews Table Card (8 cols) */}
        <Card className="lg:col-span-8 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#202D42] pb-3">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#A3E635]" />
              Upcoming Interviews
            </h2>
            <Badge variant="active" dot>
              {upcoming.length} Sessions Booked
            </Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Branch / Role</TableHead>
                <TableHead>Interviewer</TableHead>
                <TableHead>Date / Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcoming.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar src={item.studentAvatar} name={item.studentName} size="sm" />
                      <span className="font-bold text-white">{item.studentName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold text-white">{item.branch} • </span>
                    <span className="text-xs text-[#94A3B8]">{item.role}</span>
                  </TableCell>
                  <TableCell className="text-xs text-[#94A3B8] font-medium">{item.interviewerName}</TableCell>
                  <TableCell className="text-xs text-white font-bold">{item.dateTime}</TableCell>
                  <TableCell>
                    <Badge variant="active" dot>
                      Confirmed
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Video className="w-3 h-3 text-[#0B0F17]" />}
                        onClick={() => info('Launching Meeting', `Opening Google Meet video call...`)}
                        className="text-xs py-1 px-2.5"
                      >
                        View/Join
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => info('Reschedule Session', `Rescheduling slot for ${item.studentName}`)}
                        className="text-xs py-1 px-2.5"
                      >
                        Reschedule
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Performance Charts Card (4 cols) */}
        <Card className="lg:col-span-4 p-6 bg-[#101726] border-[#202D42] space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Performance Charts
            </h3>
            <span className="text-[11px] text-[#94A3B8] block mt-0.5">Average Feedback Scores (0-100)</span>
          </div>

          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={feedbackTrendData}>
                <Area type="monotone" dataKey="score" stroke="#A3E635" fill="#A3E635" fillOpacity={0.25} strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-[#202D42] pt-3 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-[#162032] p-2 rounded-xl border border-[#202D42]">
              <span className="text-[10px] text-[#94A3B8] uppercase block">Technical Score</span>
              <span className="text-base font-extrabold text-[#A3E635]">88.5 / 100</span>
            </div>
            <div className="bg-[#162032] p-2 rounded-xl border border-[#202D42]">
              <span className="text-[10px] text-[#94A3B8] uppercase block">Communication</span>
              <span className="text-base font-extrabold text-sky-400">82.0 / 100</span>
            </div>
          </div>
        </Card>

      </div>

      {/* MIDDLE & BOTTOM SECTION strictly matching design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SECTION (8 cols): Interview Feedbacks Cards */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-lg font-extrabold text-white">Interview Feedbacks</h2>
          
          <div className="space-y-4">
            {feedbacks.map((fb) => (
              <Card key={fb.id} glowOnHover className="p-6 space-y-4 border-[#202D42]">
                
                {/* Feedback Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar src={fb.studentAvatar} name={fb.studentName} size="md" />
                    <div>
                      <h3 className="text-base font-extrabold text-white">{fb.studentName}</h3>
                      <p className="text-xs text-[#A3E635] font-semibold">{fb.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#94A3B8] block">Interviewer: <strong className="text-white">{fb.interviewerName}</strong></span>
                    {/* Star Rating Display */}
                    <div className="flex items-center gap-0.5 text-amber-400 mt-1 justify-end">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < fb.rating ? 'fill-current text-amber-400' : 'text-slate-600'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Summary Quote Box */}
                <div className="bg-[#101726] border border-[#202D42] rounded-2xl p-4 space-y-1">
                  <span className="text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-wider block">
                    Interviewer Summary Feedback
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed italic">
                    "{fb.summary}"
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<FileText className="w-3.5 h-3.5 text-[#A3E635]" />}
                      onClick={() => info('Feedback Report', `Opening complete feedback evaluation report for ${fb.studentName}`)}
                    >
                      View Detailed Report
                    </Button>
                    <Button
                      variant="tertiary"
                      size="sm"
                      onClick={() => info('Contact Candidate', `Sending direct feedback email to ${fb.studentName}`)}
                    >
                      Contact Student
                    </Button>
                  </div>

                  <Badge variant="active" dot>
                    Mock Score: {fb.mockScore} / 100
                  </Badge>
                </div>

              </Card>
            ))}
          </div>
        </div>

        {/* RIGHT SECTION (4 cols): Calendar View & Student Scores Grid */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Calendar View & Agenda Card strictly matching design */}
          <Card className="p-5 space-y-4 bg-[#101726] border-[#202D42]">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Calendar View & Day Agenda
            </h3>
            
            {/* Mini Calendar Grid Simulation */}
            <div className="bg-[#162032] border border-[#202D42] rounded-2xl p-3 text-center text-xs space-y-2">
              <div className="font-bold text-[#A3E635]">October 2025</div>
              <div className="grid grid-cols-7 gap-1 text-[10px] font-bold text-[#64748B]">
                <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs text-white font-medium">
                <span className="text-[#64748B]">29</span><span className="text-[#64748B]">30</span><span>1</span><span>2</span><span>3</span><span className="text-[#A3E635] font-extrabold underline">4</span><span>5</span>
                <span>6</span><span>7</span><span className="bg-[#A3E635] text-[#0B0F17] rounded-md font-bold">8</span><span>9</span><span>10</span><span>11</span><span>12</span>
              </div>
            </div>

            {/* Agenda List */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#162032] border border-[#202D42]">
                <span className="font-bold text-white">Mon Agenda</span>
                <span className="text-[10px] text-[#A3E635] font-semibold">07:00 - 9:00 PM</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#162032] border border-[#202D42]">
                <span className="font-bold text-white">Tue Agenda</span>
                <span className="text-[10px] text-[#A3E635] font-semibold">07:00 - 5:00 PM</span>
              </div>
            </div>
          </Card>

          {/* Student Scores 2x2 Grid strictly matching design */}
          <Card className="p-5 space-y-4 bg-[#101726] border-[#202D42]">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Student Scores & Rankings
            </h3>
            
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-[#162032] border border-[#202D42] rounded-2xl p-3 space-y-1">
                <Avatar src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" name="Ervara" size="sm" className="mx-auto" />
                <span className="text-[10px] text-[#94A3B8] uppercase block">Mock Score</span>
                <span className="text-xl font-extrabold text-[#A3E635]">90</span>
              </div>

              <div className="bg-[#162032] border border-[#202D42] rounded-2xl p-3 space-y-1">
                <Avatar src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120" name="Priya" size="sm" className="mx-auto" />
                <span className="text-[10px] text-[#94A3B8] uppercase block">ATS Score</span>
                <span className="text-xl font-extrabold text-sky-400">94</span>
              </div>

              <div className="bg-[#162032] border border-[#202D42] rounded-2xl p-3 space-y-1">
                <Avatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120" name="Jamel" size="sm" className="mx-auto" />
                <span className="text-[10px] text-[#94A3B8] uppercase block">Mock Score</span>
                <span className="text-xl font-extrabold text-[#A3E635]">79</span>
              </div>

              <div className="bg-[#162032] border border-[#202D42] rounded-2xl p-3 space-y-1">
                <Avatar src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120" name="Kaelen" size="sm" className="mx-auto" />
                <span className="text-[10px] text-[#94A3B8] uppercase block">ATS Score</span>
                <span className="text-xl font-extrabold text-sky-400">87</span>
              </div>
            </div>

            <Button
              variant="tertiary"
              size="sm"
              fullWidth
              onClick={() => success('Candidates Identified', 'Top candidate recommendations highlighted.')}
              className="font-bold text-xs"
            >
              Identify Top Candidates
            </Button>
          </Card>

        </div>

      </div>

      {/* FOOTER ACTION BUTTONS strictly matching design */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 border-t border-[#202D42]">
        <Button
          variant="secondary"
          size="md"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={() => success('Export Report', 'Downloaded Mock_Performance_Summary.xlsx')}
        >
          Export Analytics Report
        </Button>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Send className="w-4 h-4" />}
          onClick={() => success('Recommendations Dispatched', 'Training roadmap sent to student mentors.')}
          className="px-6 font-extrabold shadow-[0_0_15px_rgba(163,230,53,0.3)]"
        >
          Send Training Recommendations
        </Button>
      </div>

      {/* SCHEDULE MOCK INTERVIEW MODAL */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Mock Interview"
        subtitle="Book a 1-on-1 technical evaluation slot."
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <Input
            label="Student Name"
            placeholder="e.g. Rahul Sharma"
            value={scheduleStudent}
            onChange={(e) => setScheduleStudent(e.target.value)}
            required
          />
          <Input
            label="Interviewer Name"
            placeholder="e.g. Dr. James Anderson"
            value={scheduleInterviewer}
            onChange={(e) => setScheduleInterviewer(e.target.value)}
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
              label="Time Slot"
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
              Confirm Schedule
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
