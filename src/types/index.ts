export type UserRole = 'tpo_admin' | 'student' | 'recruiter';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  phone?: string;
}

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  branch: string;
  cgpa: number;
  passingYear: number;
  backlogs: number;
  placementStatus: 'Placed' | 'Unplaced' | 'In Process' | 'Opted Out';
  companyPlaced?: string;
  packageOffered?: string; // e.g. "12 LPA"
  resumeUrl?: string;
  skills: string[];
  avatar?: string;
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  website: string;
  tier: 'Dream' | 'Super Dream' | 'Standard' | 'Mass Recruiter';
  minCgpa: number;
  allowedBranches: string[];
  maxBacklogs: number;
  hrContact: {
    name: string;
    email: string;
    phone: string;
  };
  visitedYear: number;
  hiredCount: number;
  avgPackage: string;
  highestPackage: string;
  status: 'Active' | 'Upcoming' | 'Completed';
}

export interface PlacementDrive {
  id: string;
  driveCode: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  roleTitle: string;
  jobType: 'Full Time' | 'Internship' | 'PPO' | 'Dual (Intern + FT)';
  ctc: string;
  stipend?: string;
  location: string;
  eligibility: {
    minCgpa: number;
    maxBacklogs: number;
    branches: string[];
    passingYear: number;
  };
  registrationDeadline: string;
  driveDate: string;
  rounds: string[];
  status: 'Ongoing' | 'Upcoming' | 'Conducted' | 'Completed' | 'Draft';
  appliedStudentsCount: number;
  shortlistedCount: number;
  placedCount: number;
}

export interface DriveApplication {
  id: string;
  driveId: string;
  driveCode: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  branch: string;
  cgpa: number;
  companyName: string;
  roleTitle: string;
  appliedDate: string;
  currentRound: string;
  status: 'Applied' | 'Screened' | 'Interview Scheduled' | 'Offered' | 'Rejected' | 'Selected';
}

export interface PlacementMetrics {
  totalStudents: number;
  companiesVisited: number;
  placedStudents: number;
  upcomingDrives: number;
  highestPackage: string;
  averagePackage: string;
  placementPercentage: number;
  branchWiseStats: Array<{ branch: string; placed: number; total: number }>;
}
