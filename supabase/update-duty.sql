-- Run once if you already ran update-reports.sql: allow the shared "Staff on Duty" logins.
alter table staff drop constraint staff_role_check;
alter table staff add constraint staff_role_check check (role in (
  'director', 'head_of_school', 'vice_principal', 'senior_teacher',
  'primary_unit_leader', 'nursery_unit_leader', 'operations_manager',
  'admin_secretary', 'teacher', 'staff_on_duty'
));
