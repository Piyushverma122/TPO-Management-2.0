-- Interviews table + offer lifecycle columns on placements.
-- Reuses existing enum public.interview_status (Scheduled | Completed | Cancelled | Passed | Failed).
-- The backend uses the service-role key (bypasses RLS); RLS is enabled with no policies so the anon key cannot read these tables.

-- 1. Interviews
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.drive_applications(id) on delete cascade,
  drive_id uuid not null references public.placement_drives(id),
  student_id uuid not null references public.students(id),
  company_id uuid not null references public.companies(id),
  round_name varchar(100) not null,
  round_no integer not null default 1,
  scheduled_at timestamptz not null,
  end_at timestamptz,
  mode varchar(20) not null default 'Online' check (mode in ('Online', 'Offline')),
  meeting_url text,
  venue varchar(255),
  interviewer_name varchar(150),
  status public.interview_status not null default 'Scheduled',
  feedback text,
  reschedule_count integer not null default 0,
  calendar_event_id uuid references public.calendar_events(id) on delete set null,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_interviews_application_id on public.interviews(application_id);
create index if not exists idx_interviews_student_id on public.interviews(student_id);
create index if not exists idx_interviews_company_id on public.interviews(company_id);
create index if not exists idx_interviews_scheduled_at on public.interviews(scheduled_at);

alter table public.interviews enable row level security;
revoke all on public.interviews from anon;

-- 2. Offer lifecycle on placements (placements already holds the offer file columns)
alter table public.placements
  add column if not exists application_id uuid references public.drive_applications(id) on delete set null,
  add column if not exists role_title varchar(150),
  add column if not exists response_deadline timestamptz,
  add column if not exists reviewed_by uuid references public.users(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_remarks text,
  add column if not exists responded_at timestamptz,
  add column if not exists decline_reason text;

-- Existing "Pending" offers were already visible to students, so they become "Released".
update public.placements set offer_status = 'Released' where offer_status = 'Pending';

create unique index if not exists uq_placements_drive_student on public.placements(drive_id, student_id);

-- 3. Enum values (must run outside a transaction block in some Postgres versions; Supabase handles each statement separately)
alter type public.notification_type add value if not exists 'Offer Update';
alter type public.notification_type add value if not exists 'Placement Update';
alter type public.application_stage add value if not exists 'Offer Declined';
