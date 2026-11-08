-- Run this once in a NEW, empty Supabase project: SQL Editor -> New query -> paste -> Run.
-- Two tables. No logins, no functions, no cron jobs. Only the app's server can read or write them.

create table staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null check (role in (
    'director', 'head_of_school', 'vice_principal', 'senior_teacher',
    'primary_unit_leader', 'nursery_unit_leader', 'operations_manager'
  )),
  reports_to uuid references staff(id),
  pin text                       -- each person's own PIN; without one they cannot sign in
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  template text not null,
  period date not null,          -- the day (daily reports) or the Monday of the week (weekly reports)
  answers jsonb not null,
  submitted_at timestamptz not null default now(),
  unique (staff_id, period)
);

-- Row level security ON with no policies = nobody can touch these tables with the public key.
alter table staff enable row level security;
alter table submissions enable row level security;

-- ---- Add your people (edit names/roles, then run) ----
insert into staff (name, role, pin) values
  ('Test Senior Teacher', 'senior_teacher', '3333'),
  ('Test Vice Principal', 'vice_principal', '4444'),
  ('Test Primary Unit Leader', 'primary_unit_leader', '5555'),
  ('Test Nursery Unit Leader', 'nursery_unit_leader', '6666'),
  ('Test Operations Manager', 'operations_manager', '7777');

insert into staff (name, role, pin) values
  ('Test Head of School', 'head_of_school', '1111'),
  ('Test Director', 'director', '2222');

-- The Head of School reads the two unit leaders' reports:
update staff set reports_to = (select id from staff where role = 'head_of_school')
where role in ('primary_unit_leader', 'nursery_unit_leader');
