export type UserRole = 'admin' | 'tpo' | 'student' | 'recruiter' | 'faculty' | 'tpo_admin';

export interface User {
  id: string;
  name: string;
  full_name?: string;
  email: string;
  role: UserRole;
  avatar?: string;
  avatar_url?: string;
  department?: string;
  phone?: string;
  must_change_password?: boolean;
}

export interface Student {
  id: string;
  rollNumber: string;
  enrollmentNumber?: string;
  name: string;
  email: string;
  phone?: string;
  alternatePhone?: string;
  gender?: string;
  dateOfBirth?: string;
  branch: string;
  currentSemester?: number;
  cgpa: number;
  passingYear: number;
  backlogs: number;
  historyBacklogs?: number;
  tenthPercentage?: number;
  twelfthPercentage?: number;
  diplomaPercentage?: number;
  placementStatus: 'Placed' | 'Unplaced' | 'In Process' | 'Opted Out';
  companyPlaced?: string;
  packageOffered?: string; // e.g. "12 LPA"
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  resumeHeadline?: string;
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  leetcodeUrl?: string;
  hackerrankUrl?: string;
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
  location?: string;
  description?: string;
  jobRole?: string;
  bond?: string;
  deadline?: string;
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
