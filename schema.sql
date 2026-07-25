-- =============================================================================
-- SMART PLACEMENT & TPO MANAGEMENT SYSTEM 2.0
-- PRODUCTION DATABASE SCHEMA - VERSION 3 (Supabase PostgreSQL)
-- =============================================================================

-- Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. ENUM TYPES DEFINITIONS
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'tpo', 'faculty', 'student', 'recruiter');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE placement_status AS ENUM ('Placed', 'Unplaced', 'In Process', 'Opted Out');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE company_tier AS ENUM ('Dream', 'Super Dream', 'Standard', 'Mass Recruiter');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE company_status AS ENUM ('Active', 'Upcoming', 'Completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE job_type AS ENUM ('Full Time', 'Internship', 'PPO', 'Dual (Intern + FT)');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE drive_status AS ENUM ('Ongoing', 'Upcoming', 'Conducted', 'Completed', 'Draft');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE application_stage AS ENUM ('Applied', 'Eligible', 'Shortlisted', 'Round 1', 'Round 2', 'Technical', 'HR', 'Offer', 'Rejected', 'Selected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE interview_status AS ENUM ('Scheduled', 'Completed', 'Cancelled', 'Passed', 'Failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('Drive Announcement', 'Application Update', 'Interview Scheduled', 'System Alert');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE training_category AS ENUM ('Technical', 'Aptitude', 'Soft Skills', 'Coding Bootcamp');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE training_level AS ENUM ('Beginner', 'Intermediate', 'Advanced');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE training_status AS ENUM ('Active', 'Upcoming', 'Completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE doc_type AS ENUM ('jd_pdf', 'offer_template', 'brochure', 'ppt', 'image');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE email_status AS ENUM ('sent', 'delivered', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE event_type AS ENUM ('placement_drive', 'mock_interview', 'training', 'meeting', 'deadline', 'reminder');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE setting_category AS ENUM ('General', 'Email', 'Notification', 'Placement', 'Training', 'Security');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =============================================================================
-- 2. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 3. CORE USER & DEVICE MANAGEMENT TABLES
-- =============================================================================

-- Table 1: USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    phone VARCHAR(20),
    avatar_url TEXT,
    department VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 2: USER_DEVICES
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(150),
    browser VARCHAR(100),
    os VARCHAR(100),
    fcm_token TEXT NOT NULL,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_fcm_token UNIQUE (user_id, fcm_token)
);

-- Table 3: USER_DASHBOARD_PREFERENCES
CREATE TABLE IF NOT EXISTS user_dashboard_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
    layout JSONB NOT NULL DEFAULT '{}'::jsonb,
    theme VARCHAR(50) NOT NULL DEFAULT 'dark',
    pinned_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 4: DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    head_of_department VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 5: BRANCHES
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 4. FACULTY, RECRUITER & COMPANY TABLES
-- =============================================================================

-- Table 6: FACULTY
CREATE TABLE IF NOT EXISTS faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    designation VARCHAR(100) NOT NULL,
    specialization VARCHAR(150),
    experience_years INT NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
    office_phone VARCHAR(20),
    office_location VARCHAR(150),
    joining_date DATE,
    profile_photo_url TEXT,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 7: COMPANIES
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) UNIQUE NOT NULL,
    logo_url TEXT,
    industry VARCHAR(100) NOT NULL,
    website VARCHAR(255),
    tier company_tier NOT NULL DEFAULT 'Standard',
    min_cgpa NUMERIC(4,2) NOT NULL DEFAULT 6.00 CHECK (min_cgpa >= 0.00 AND min_cgpa <= 10.00),
    max_backlogs INT NOT NULL DEFAULT 0 CHECK (max_backlogs >= 0),
    hr_name VARCHAR(150) NOT NULL,
    hr_email VARCHAR(255) NOT NULL,
    hr_phone VARCHAR(20) NOT NULL,
    visited_year INT NOT NULL,
    hired_count INT NOT NULL DEFAULT 0 CHECK (hired_count >= 0),
    avg_package NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    highest_package NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status company_status NOT NULL DEFAULT 'Active',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 8: COMPANY_ELIGIBLE_BRANCHES
CREATE TABLE IF NOT EXISTS company_eligible_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT unique_company_branch UNIQUE (company_id, branch_id)
);

-- Table 9: RECRUITERS
CREATE TABLE IF NOT EXISTS recruiters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    designation VARCHAR(100) NOT NULL,
    official_email VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 10: COMPANY_DOCUMENTS
CREATE TABLE IF NOT EXISTS company_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    document_type doc_type NOT NULL,
    bucket_name VARCHAR(100) NOT NULL DEFAULT 'company-documents',
    storage_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    file_size INT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 5. NORMALIZED STUDENT & SKILL MODULE
-- =============================================================================

-- Table 11: SKILLS
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) DEFAULT 'General',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 12: STUDENTS
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    
    -- Personal Profile
    dob DATE,
    gender VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    resume_headline VARCHAR(255),
    bio TEXT,
    
    -- Academic Performance
    tenth_percentage NUMERIC(5,2) CHECK (tenth_percentage >= 0 AND tenth_percentage <= 100),
    twelfth_percentage NUMERIC(5,2) CHECK (twelfth_percentage >= 0 AND twelfth_percentage <= 100),
    diploma_percentage NUMERIC(5,2) CHECK (diploma_percentage >= 0 AND diploma_percentage <= 100),
    current_semester INT NOT NULL DEFAULT 1 CHECK (current_semester BETWEEN 1 AND 10),
    cgpa NUMERIC(4,2) NOT NULL CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
    passing_year INT NOT NULL,
    active_backlogs INT NOT NULL DEFAULT 0 CHECK (active_backlogs >= 0),
    history_backlogs INT NOT NULL DEFAULT 0 CHECK (history_backlogs >= 0),
    
    -- Placement Summary
    placement_status placement_status NOT NULL DEFAULT 'Unplaced',
    active_resume_id UUID,
    
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 13: STUDENT_SEMESTERS
CREATE TABLE IF NOT EXISTS student_semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 10),
    cgpa NUMERIC(4,2) NOT NULL CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
    credits INT NOT NULL DEFAULT 0 CHECK (credits >= 0),
    academic_year INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_semester UNIQUE (student_id, semester)
);

-- Table 14: STUDENT_SKILLS
CREATE TABLE IF NOT EXISTS student_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency VARCHAR(50) DEFAULT 'Intermediate',
    CONSTRAINT unique_student_skill_rel UNIQUE (student_id, skill_id)
);

-- Table 15: RESUMES
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    version_title VARCHAR(50) NOT NULL DEFAULT 'Resume V1',
    bucket_name VARCHAR(100) NOT NULL DEFAULT 'resumes',
    storage_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    file_size INT NOT NULL,
    file_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 16: RESUME_VERIFICATIONS
CREATE TABLE IF NOT EXISTS resume_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    verified_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 6. PLACEMENT DRIVES & PLACEMENTS
-- =============================================================================

-- Table 17: PLACEMENT_DRIVES
CREATE TABLE IF NOT EXISTS placement_drives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_code VARCHAR(50) UNIQUE NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role_title VARCHAR(150) NOT NULL,
    job_type job_type NOT NULL DEFAULT 'Full Time',
    ctc NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    stipend NUMERIC(10,2) DEFAULT 0.00,
    location VARCHAR(150) NOT NULL,
    min_cgpa NUMERIC(4,2) NOT NULL DEFAULT 6.00 CHECK (min_cgpa >= 0.00 AND min_cgpa <= 10.00),
    max_backlogs INT NOT NULL DEFAULT 0 CHECK (max_backlogs >= 0),
    passing_year INT NOT NULL,
    registration_deadline TIMESTAMPTZ NOT NULL,
    drive_date DATE NOT NULL,
    rounds TEXT[] NOT NULL,
    status drive_status NOT NULL DEFAULT 'Upcoming',
    applied_count INT NOT NULL DEFAULT 0 CHECK (applied_count >= 0),
    shortlisted_count INT NOT NULL DEFAULT 0 CHECK (shortlisted_count >= 0),
    placed_count INT NOT NULL DEFAULT 0 CHECK (placed_count >= 0),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 18: DRIVE_ELIGIBLE_BRANCHES
CREATE TABLE IF NOT EXISTS drive_eligible_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID NOT NULL REFERENCES placement_drives(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT unique_drive_branch_rel UNIQUE (drive_id, branch_id)
);

-- Table 19: DRIVE_ELIGIBLE_DEPARTMENTS
CREATE TABLE IF NOT EXISTS drive_eligible_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID NOT NULL REFERENCES placement_drives(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    CONSTRAINT unique_drive_dept_rel UNIQUE (drive_id, department_id)
);

-- Table 20: DRIVE_ELIGIBLE_BATCHES
CREATE TABLE IF NOT EXISTS drive_eligible_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID NOT NULL REFERENCES placement_drives(id) ON DELETE CASCADE,
    passing_year INT NOT NULL,
    CONSTRAINT unique_drive_batch_rel UNIQUE (drive_id, passing_year)
);

-- Table 21: PLACEMENTS (Dedicated Successful Placements Record)
CREATE TABLE IF NOT EXISTS placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    drive_id UUID NOT NULL REFERENCES placement_drives(id) ON DELETE CASCADE,
    package NUMERIC(10,2) NOT NULL CHECK (package >= 0.00),
    joining_date DATE,
    bucket_name VARCHAR(100) DEFAULT 'offer-letters',
    storage_path TEXT,
    file_name VARCHAR(255),
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    file_size INT,
    offer_letter_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Accepted',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 22: DRIVE_APPLICATIONS
CREATE TABLE IF NOT EXISTS drive_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID NOT NULL REFERENCES placement_drives(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
    applied_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_round VARCHAR(100) NOT NULL DEFAULT 'Applied',
    status application_stage NOT NULL DEFAULT 'Applied',
    offer_letter_url TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_drive_application UNIQUE (drive_id, student_id)
);

-- Table 23: APPLICATION_STATUS_HISTORY
CREATE TABLE IF NOT EXISTS application_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES drive_applications(id) ON DELETE CASCADE,
    stage application_stage NOT NULL,
    round_name VARCHAR(100),
    remarks TEXT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 7. INTERVIEWS & TRAINING MODULES
-- =============================================================================

-- Table 24: MOCK_INTERVIEWS
CREATE TABLE IF NOT EXISTS mock_interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    interview_date TIMESTAMPTZ NOT NULL,
    round_name VARCHAR(100) NOT NULL,
    score NUMERIC(3,1) CHECK (score >= 0.0 AND score <= 10.0),
    feedback TEXT,
    status interview_status NOT NULL DEFAULT 'Scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 25: TRAINING_MODULES
CREATE TABLE IF NOT EXISTS training_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    category training_category NOT NULL DEFAULT 'Technical',
    faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    duration VARCHAR(50) NOT NULL,
    level training_level NOT NULL DEFAULT 'Intermediate',
    status training_status NOT NULL DEFAULT 'Active',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 26: TRAINING_SESSIONS
CREATE TABLE IF NOT EXISTS training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
    session_title VARCHAR(200) NOT NULL,
    faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    session_date TIMESTAMPTZ NOT NULL,
    meeting_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 27: TRAINING_MATERIALS
CREATE TABLE IF NOT EXISTS training_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    bucket_name VARCHAR(100) NOT NULL DEFAULT 'training-materials',
    storage_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    file_size INT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 28: TRAINING_ENROLLMENTS
CREATE TABLE IF NOT EXISTS training_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    progress_percentage INT NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    is_certified BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_training UNIQUE (module_id, student_id)
);

-- Table 29: TRAINING_ATTENDANCE
CREATE TABLE IF NOT EXISTS training_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    is_present BOOLEAN NOT NULL DEFAULT false,
    marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_session_attendance UNIQUE (session_id, student_id)
);

-- Table 30: TRAINING_ASSIGNMENTS
CREATE TABLE IF NOT EXISTS training_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    max_marks INT NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 31: TRAINING_CERTIFICATES
CREATE TABLE IF NOT EXISTS training_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
    bucket_name VARCHAR(100) NOT NULL DEFAULT 'student-documents',
    storage_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    file_size INT NOT NULL,
    certificate_url TEXT NOT NULL,
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_certificate UNIQUE (student_id, module_id)
);

-- =============================================================================
-- 8. HIGH-PERFORMANCE CHAT & MESSAGING MODULE
-- =============================================================================

-- Table 32: CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150),
    is_group BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    last_message_id UUID,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 33: CONVERSATION_PARTICIPANTS
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_chat_participant UNIQUE (conversation_id, user_id)
);

-- Table 34: CHAT_MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 35: CHAT_ATTACHMENTS
CREATE TABLE IF NOT EXISTS chat_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    bucket_name VARCHAR(100) NOT NULL DEFAULT 'chat-attachments',
    storage_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 36: MESSAGE_READ_RECEIPTS
CREATE TABLE IF NOT EXISTS message_read_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_read_receipt UNIQUE (message_id, user_id)
);

-- =============================================================================
-- 9. NOTIFICATIONS, EMAIL LOGS, CALENDAR & AUDIT
-- =============================================================================

-- Table 37: NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'System Alert',
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    is_email_sent BOOLEAN NOT NULL DEFAULT false,
    is_push_sent BOOLEAN NOT NULL DEFAULT false,
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 38: EMAIL_LOGS
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template_name VARCHAR(100),
    status email_status NOT NULL DEFAULT 'sent',
    resend_message_id VARCHAR(150),
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

-- Table 39: CALENDAR_EVENTS
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type event_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location VARCHAR(150),
    related_entity_id UUID,
    is_all_day BOOLEAN NOT NULL DEFAULT false,
    reminder_minutes_before INT NOT NULL DEFAULT 30,
    status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 40: ELIGIBILITY_RULES
CREATE TABLE IF NOT EXISTS eligibility_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(150) NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    min_cgpa NUMERIC(4,2) NOT NULL CHECK (min_cgpa >= 0.00 AND min_cgpa <= 10.00),
    max_backlogs INT NOT NULL DEFAULT 0 CHECK (max_backlogs >= 0),
    passing_year INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 41: RULE_ELIGIBLE_BRANCHES
CREATE TABLE IF NOT EXISTS rule_eligible_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES eligibility_rules(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT unique_rule_branch UNIQUE (rule_id, branch_id)
);

-- Table 42: REPORTS_SUMMARY
CREATE TABLE IF NOT EXISTS reports_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year INT UNIQUE NOT NULL,
    total_students INT NOT NULL,
    placed_students INT NOT NULL,
    companies_visited INT NOT NULL,
    highest_package NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    average_package NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    branch_wise_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 43: SYSTEM_SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    category setting_category NOT NULL DEFAULT 'General',
    value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 44: AUDIT_LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    browser VARCHAR(100),
    device VARCHAR(100),
    user_agent TEXT,
    request_method VARCHAR(10),
    request_url TEXT,
    session_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 10. FUTURE SCALABILITY TABLES
-- =============================================================================

-- Table 45: ALUMNI
CREATE TABLE IF NOT EXISTS alumni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    graduation_year INT NOT NULL,
    current_company VARCHAR(150),
    current_designation VARCHAR(100),
    linkedin_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 46: INTERNSHIPS
CREATE TABLE IF NOT EXISTS internships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    company_name VARCHAR(150) NOT NULL,
    role VARCHAR(100) NOT NULL,
    stipend NUMERIC(10,2) DEFAULT 0.00,
    start_date DATE NOT NULL,
    end_date DATE,
    is_ppo_received BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 47: HACKATHONS_EVENTS
CREATE TABLE IF NOT EXISTS hackathons_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    organizer VARCHAR(150) NOT NULL,
    event_date DATE NOT NULL,
    achievement VARCHAR(150),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 11. COMPREHENSIVE INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_devices_token ON user_devices(fcm_token);
CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_user ON faculty(user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_dept ON faculty(department_id);
CREATE INDEX IF NOT EXISTS idx_recruiters_company ON recruiters(company_id);
CREATE INDEX IF NOT EXISTS idx_students_roll ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_branch ON students(branch_id);
CREATE INDEX IF NOT EXISTS idx_students_cgpa ON students(cgpa);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(placement_status);
CREATE INDEX IF NOT EXISTS idx_students_backlogs ON students(active_backlogs);
CREATE INDEX IF NOT EXISTS idx_students_deleted ON students(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_student_semesters_std ON student_semesters(student_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_rel ON student_skills(student_id, skill_id);
CREATE INDEX IF NOT EXISTS idx_resumes_student ON resumes(student_id);
CREATE INDEX IF NOT EXISTS idx_resumes_active ON resumes(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_deleted ON companies(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_drives_code ON placement_drives(drive_code);
CREATE INDEX IF NOT EXISTS idx_drives_company ON placement_drives(company_id);
CREATE INDEX IF NOT EXISTS idx_drives_status ON placement_drives(status);
CREATE INDEX IF NOT EXISTS idx_drives_deadline ON placement_drives(registration_deadline);
CREATE INDEX IF NOT EXISTS idx_drives_deleted ON placement_drives(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_placements_student ON placements(student_id);
CREATE INDEX IF NOT EXISTS idx_placements_company ON placements(company_id);
CREATE INDEX IF NOT EXISTS idx_placements_drive ON placements(drive_id);
CREATE INDEX IF NOT EXISTS idx_applications_drive ON drive_applications(drive_id);
CREATE INDEX IF NOT EXISTS idx_applications_student ON drive_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON drive_applications(status);
CREATE INDEX IF NOT EXISTS idx_app_history_app ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_student ON mock_interviews(student_id);
CREATE INDEX IF NOT EXISTS idx_interviews_faculty ON mock_interviews(faculty_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments ON training_enrollments(module_id, student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_calendar_time ON calendar_events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- =============================================================================
-- 12. UPDATED_AT TRIGGERS BINDING
-- =============================================================================

CREATE OR REPLACE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_user_devices_modtime BEFORE UPDATE ON user_devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_departments_modtime BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_branches_modtime BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_faculty_modtime BEFORE UPDATE ON faculty FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_companies_modtime BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_recruiters_modtime BEFORE UPDATE ON recruiters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_company_documents_modtime BEFORE UPDATE ON company_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_students_modtime BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_student_semesters_modtime BEFORE UPDATE ON student_semesters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_resumes_modtime BEFORE UPDATE ON resumes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_drives_modtime BEFORE UPDATE ON placement_drives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_placements_modtime BEFORE UPDATE ON placements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_applications_modtime BEFORE UPDATE ON drive_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_interviews_modtime BEFORE UPDATE ON mock_interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_training_modules_modtime BEFORE UPDATE ON training_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_training_sessions_modtime BEFORE UPDATE ON training_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_training_materials_modtime BEFORE UPDATE ON training_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_training_enrollments_modtime BEFORE UPDATE ON training_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_training_assignments_modtime BEFORE UPDATE ON training_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_conversations_modtime BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_chat_messages_modtime BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_calendar_events_modtime BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_eligibility_rules_modtime BEFORE UPDATE ON eligibility_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_reports_summary_modtime BEFORE UPDATE ON reports_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_system_settings_modtime BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_alumni_modtime BEFORE UPDATE ON alumni FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_internships_modtime BEFORE UPDATE ON internships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_hackathons_events_modtime BEFORE UPDATE ON hackathons_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Base Read Policies
CREATE POLICY "Allow authenticated read on companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read on placement_drives" ON placement_drives FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read on departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read on branches" ON branches FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read on skills" ON skills FOR SELECT USING (true);
