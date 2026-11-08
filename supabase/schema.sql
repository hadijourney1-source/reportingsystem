-- Run this once in a NEW, empty Supabase project: SQL Editor -> New query -> paste -> Run.
-- Two tables. No logins, no functions, no cron jobs. Only the app's server can read or write them.

create table staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null check (role in (
    'director', 'head_of_school', 'vice_principal', 'senior_teacher',
    'primary_unit_leader', 'nursery_unit_leader', 'operations_manager',
    'admin_secretary', 'teacher'
  )),
  reports_to uuid references staff(id),
  pin text                       -- chosen by each person on first sign-in; the director and head of school need one set here
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  template text not null,        -- which report, e.g. head_of_school_daily
  period date not null,          -- the day (daily reports) or the Monday of the week (weekly reports)
  answers jsonb not null,
  submitted_at timestamptz not null default now(),
  unique (staff_id, template, period)
);

-- Row level security ON with no policies = nobody can touch these tables with the public key.
alter table staff enable row level security;
alter table submissions enable row level security;

-- ---- Add your people (edit names/roles, then run) ----
insert into staff (name, role) values
  ('Test Senior Teacher', 'senior_teacher'),
  ('Test Vice Principal', 'vice_principal'),
  ('Test Primary Unit Leader', 'primary_unit_leader'),
  ('Test Nursery Unit Leader', 'nursery_unit_leader'),
  ('Test Operations Manager', 'operations_manager');

insert into staff (name, role, pin) values
  ('Test Head of School', 'head_of_school', '1111'),
  ('Test Director', 'director', '2222');

-- The Head of School reads the two unit leaders' reports:
update staff set reports_to = (select id from staff where role = 'head_of_school')
where role in ('primary_unit_leader', 'nursery_unit_leader');
