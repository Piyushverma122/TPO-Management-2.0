-- Mail-style placement drives: several profiles per drive, approval workflow, JD file, richer details.
-- Existing drives stay visible: they are backfilled as Approved with one profile each.

-- 1. Approval + announcement fields on placement_drives
alter table public.placement_drives
  add column if not exists approval_status varchar(20) not null default 'Approved'
    check (approval_status in ('Draft', 'Pending', 'Approved', 'Rejected')),
  add column if not exists approved_by uuid references public.users(id),
  add column if not exists approved_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists published_at timestamptz,
  add column if not exists drive_mode varchar(20) not null default 'On Campus'
    check (drive_mode in ('On Campus', 'Off Campus', 'Pool Campus', 'Virtual')),
  add column if not exists location_note text,
  add column if not exists registration_link text,
  add column if not exists contact_name varchar(150),
  add column if not exists contact_email varchar(255),
  add column if not exists contact_phone varchar(30),
  add column if not exists bond_details text,
  add column if not exists jd_key text,
  add column if not exists jd_name varchar(255),
  add column if not exists jd_mime varchar(100);

update public.placement_drives set published_at = coalesce(published_at, created_at) where approval_status = 'Approved' and published_at is null;

create index if not exists idx_placement_drives_approval on public.placement_drives(approval_status);
create unique index if not exists uq_placement_drives_drive_code on public.placement_drives(drive_code) where deleted_at is null;

-- 2. One drive, many profiles (e.g. Full Stack Developer for B.Tech, Sales for MBA)
create table if not exists public.drive_profiles (
  id uuid primary key default gen_random_uuid(),
  drive_id uuid not null references public.placement_drives(id) on delete cascade,
  title varchar(150) not null,
  streams text[] not null default '{}',
  openings integer check (openings is null or openings >= 0),
  probation_months integer check (probation_months is null or probation_months >= 0),
  stipend_min numeric(10,2),
  stipend_max numeric(10,2),
  ctc_min numeric(6,2),
  ctc_max numeric(6,2),
  ppo_ctc_min numeric(6,2),
  ppo_ctc_max numeric(6,2),
  interview_mode varchar(20) check (interview_mode is null or interview_mode in ('Virtual', 'Physical', 'Hybrid')),
  interview_location varchar(255),
  responsibilities text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (stipend_max is null or stipend_min is null or stipend_max >= stipend_min),
  check (ctc_max is null or ctc_min is null or ctc_max >= ctc_min),
  check (ppo_ctc_max is null or ppo_ctc_min is null or ppo_ctc_max >= ppo_ctc_min)
);

create index if not exists idx_drive_profiles_drive_id on public.drive_profiles(drive_id);

alter table public.drive_profiles enable row level security;
revoke all on public.drive_profiles from anon;

-- 3. Give every existing drive one profile built from its single role/CTC
insert into public.drive_profiles (drive_id, title, ctc_min, ctc_max, stipend_min, stipend_max, openings)
select d.id, d.role_title, nullif(d.ctc, 0), nullif(d.ctc, 0), nullif(d.stipend, 0), nullif(d.stipend, 0), d.total_openings
from public.placement_drives d
where not exists (select 1 from public.drive_profiles p where p.drive_id = d.id);
