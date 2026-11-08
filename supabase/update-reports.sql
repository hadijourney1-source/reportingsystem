-- Run ONCE in the Supabase SQL Editor BEFORE the new version goes live.
-- 1) allow the two new roles
alter table staff drop constraint staff_role_check;
alter table staff add constraint staff_role_check check (role in (
  'director', 'head_of_school', 'vice_principal', 'senior_teacher',
  'primary_unit_leader', 'nursery_unit_leader', 'operations_manager',
  'admin_secretary', 'teacher', 'staff_on_duty'
));

-- 2) a person can now have a daily AND a weekly report in the same week
alter table submissions drop constraint submissions_staff_id_period_key;
alter table submissions add constraint submissions_staff_template_period_key unique (staff_id, template, period);
