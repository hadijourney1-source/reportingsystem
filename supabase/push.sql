-- Run once in the Supabase SQL Editor (needed for reminders).
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table push_subscriptions enable row level security;
