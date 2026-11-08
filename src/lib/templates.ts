// The six report templates from "Staff Accountability Reporting Templates, 2026/2027".
// To change a question, edit it here. No database change needed.

export type Field =
  | { id: string; type: 'yesno'; label: string; detail?: { on: 'yes' | 'no'; label: string }; optional?: boolean }
  | { id: string; type: 'text' | 'long' | 'number' | 'date' | 'list'; label: string; optional?: boolean }
  | { id: string; type: 'choice' | 'checks'; label: string; options: string[]; optional?: boolean };

export type Section = { title: string; days?: number[]; fields: Field[] }; // days: 1=Mon ... 5=Fri

export type Template = {
  key: string;
  title: string;
  frequency: 'daily' | 'weekly';
  onRequest?: boolean; // filled in when needed (e.g. duty day), never chased or marked missing
  reportsTo: string;
  sections: Section[];
};

const yn = (id: string, label: string, detailOn?: 'yes' | 'no', detailLabel = 'Details'): Field =>
  ({ id, type: 'yesno', label, detail: detailOn ? { on: detailOn, label: detailLabel } : undefined });
const text = (id: string, label: string, optional = false): Field => ({ id, type: 'text', label, optional });
const long = (id: string, label: string, optional = false): Field => ({ id, type: 'long', label, optional });
const num = (id: string, label: string): Field => ({ id, type: 'number', label });
const list = (id: string, label: string, optional = false): Field => ({ id, type: 'list', label, optional });
const choice = (id: string, label: string, options: string[]): Field => ({ id, type: 'choice', label, options });
const checks = (id: string, label: string, options: string[], optional = true): Field =>
  ({ id, type: 'checks', label, options, optional });

const flag = long('director_flag', 'Flag for Director (write N/A if nothing to flag)');

const weekSummary = (unit: string, tones: string[]): Section => ({
  title: 'A. Week summary',
  fields: [
    { id: 'week_commencing', type: 'date', label: 'Week commencing' },
    num('teaching_days', 'Number of teaching days this week'),
    choice('tone', `Overall tone of the ${unit} this week`, tones),
  ],
});

// Shorthand for the reports from the "Eunifrance Staff Reporting Templates" doc.
// Yes/No questions must be answered; free-text questions may be left blank (= Nil).
const T = (id: string, label: string): Field => text(id, label, true);
const L = (id: string, label: string): Field => long(id, label, true);
const LS = (id: string, label: string): Field => list(id, label, true);
const N = (id: string, label: string): Field => num(id, label);
const NO = (id: string, label: string): Field => ({ id, type: 'number', label, optional: true });
const Y = (id: string, label: string): Field => yn(id, label);
const YO = (id: string, label: string): Field => ({ id, type: 'yesno', label, optional: true });

const closing: Section = {
  title: 'Closing',
  fields: [
    long('director_issues', "Any issues for Director's attention? (write Nil if none)"),
    long('support_needed', 'Support needed? (write Nil if none)'),
  ],
};

export const TEMPLATES: Record<string, Template> = {
  senior_teacher: {
    key: 'senior_teacher',
    title: 'Senior Teacher: Accountability Report',
    frequency: 'daily',
    reportsTo: 'Director',
    sections: [
      {
        title: 'A. Morning check',
        fields: [
          yn('gate_roster', 'Gate roster ran this morning', 'no', 'Reason'),
          yn('in_class_15', 'Students in classrooms within 15 minutes of start time', 'no', 'Reason'),
        ],
      },
      {
        title: 'B. Midday classroom walkthrough',
        fields: [
          list('classrooms_visited', 'Classrooms visited during walkthrough'),
          long('unusual', 'Anything unusual observed (student behaviour, teacher absence, noise, etc.)', true),
          choice('captain_logs', 'Class captain logs: entries made for morning periods', [
            'All classes: entries present',
            'Gaps found',
          ]),
          list('gap_classes', 'Classes with gaps (if any)', true),
        ],
      },
      {
        title: 'C. Discipline slips',
        fields: [
          num('slips_count', 'Number of slips received today'),
          list('slips_from', 'Slips received from (teacher names)', true),
          yn('level2_done', 'Level 2 conversations completed today', 'no', 'Student(s) not reached'),
          list('level2_notes', 'Brief notes on Level 2 conversations held (student, class, outcome)', true),
        ],
      },
      { title: 'D. Anything requiring Director attention', fields: [flag] },
      {
        title: 'E. End of day status',
        fields: [
          choice('eod', 'End of day status', ['Day closed with no major incidents', 'Matter pending for tomorrow']),
          text('pending', 'If a matter is pending, what is it?', true),
        ],
      },
    ],
  },

  primary_unit_leader: {
    key: 'primary_unit_leader',
    title: 'Primary Unit Leader: Accountability Report',
    frequency: 'weekly',
    reportsTo: 'Head of School',
    sections: [
      weekSummary('primary unit', [
        'Excellent: all systems running',
        'Good: minor issues managed',
        'Challenging: escalation needed',
      ]),
      {
        title: 'B. Teaching and learning',
        fields: [
          list('observations', 'Lesson observations conducted this week (teacher, class, brief finding)'),
          yn('scheme_ok', 'All teaching was on-scheme this week', 'no', 'Concerns found'),
          yn('plans_ok', 'Lesson plans submitted by all primary teachers', 'no', 'Missing from'),
        ],
      },
      {
        title: 'C. Student performance and intervention',
        fields: [
          long('intervention', 'Critical and High Intervention students: update on each this week'),
          long('new_concerns', 'New students showing academic concern, not previously flagged', true),
          long('cbt', 'CBT or assessment results received this week: any class or student of concern', true),
        ],
      },
      {
        title: 'D. Student conduct',
        fields: [
          long('discipline', 'Discipline incidents this week (summary, not individual slips)'),
          long('patterns', 'Patterns observed in student behaviour, positive or negative', true),
        ],
      },
      {
        title: 'E. Teacher conduct and welfare',
        fields: [
          yn('teacher_concern', 'Any teacher conduct concern this week (lateness, phone use, language, preparation)', 'yes'),
          long('welfare', 'Staff welfare or wellbeing matters to flag', true),
        ],
      },
      {
        title: 'F. Parent and community interactions',
        fields: [long('parents', 'Parent interactions of note this week (positive or concerning)')],
      },
      {
        title: 'G. Next week priorities',
        fields: [list('priorities', 'The three most important things to focus on in the primary unit next week')],
      },
      {
        title: 'H. Escalation to Head of School',
        fields: [long('hos_escalation', 'Matters requiring Head of School decision or awareness (write N/A if none)')],
      },
    ],
  },

  nursery_unit_leader: {
    key: 'nursery_unit_leader',
    title: 'Nursery Unit Leader: Accountability Report',
    frequency: 'weekly',
    reportsTo: 'Head of School',
    sections: [
      weekSummary('nursery unit', [
        'Excellent: settled and on-routine',
        'Good: minor issues managed',
        'Challenging: needs attention',
      ]),
      {
        title: 'B. Child welfare and safeguarding',
        fields: [
          yn('welfare_concern', 'Any child welfare concern observed this week (physical, emotional or social)', 'yes'),
          yn('foundational', 'Any child showing signs of early foundational difficulty (language, motor, attention, social)', 'yes', 'Name and class'),
          long('welfare_details', 'Details and observations', true),
        ],
      },
      {
        title: 'C. Assessment and learning',
        fields: [
          long('assessment', 'Assessment practices this week: what was assessed and how'),
          long('progress', 'Any child whose learning progress is notably behind or ahead of peers', true),
          yn('dear_time', 'DEAR time and water break followed as timetabled', 'no', 'Reason'),
        ],
      },
      {
        title: 'D. Routines and daily structure',
        fields: [
          checks('routines', 'Class routines consistently in place (tick all that apply)', [
            'Toilet time routine (girls first)',
            'Break time routine',
            'Class entry and exit',
            'Handling of learning materials',
            "'Thank you for the class' practised",
            'Nelson Handwriting modelled',
          ]),
          long('routine_gaps', 'Routines not yet consistent, and the plan to address them', true),
        ],
      },
      {
        title: 'E. Staff conduct and welfare',
        fields: [
          yn('staff_concern', 'Any staff conduct concern in the nursery this week', 'yes'),
          long('staff_support', 'Staff wellbeing or support needs', true),
        ],
      },
      {
        title: 'F. Parent engagement',
        fields: [
          long('parent_interactions', 'Parent interactions of note this week (gate, pick-up, communication)'),
          long('parent_feedback', 'Any parent concern or feedback relayed to the unit', true),
        ],
      },
      {
        title: 'G. Next week priorities',
        fields: [list('priorities', 'The three most important things for the nursery unit next week')],
      },
      {
        title: 'H. Escalation to Head of School',
        fields: [long('hos_escalation', 'Matters requiring Head of School decision or awareness (write N/A if none)')],
      },
    ],
  },

  operations_manager_daily: {
    key: 'operations_manager_daily',
    title: 'Operations Manager: Daily Report',
    frequency: 'daily',
    reportsTo: 'Director',
    sections: [
      {
        title: 'Part A: Report details',
        fields: [
          Y('as_reviewed_np', "Admin Secretary's (Nursery & Primary) daily report received and reviewed"),
          Y('as_reviewed_sec', "Admin Secretary's (Secondary) daily report received and reviewed"),
          Y('duty_received', 'Staff on Duty report received'),
        ],
      },
      {
        title: 'Part B: School fees collection',
        fields: [
          N('total_received', 'Total fees received today (₦)'),
          N('bank_transfer', 'Bank transfer (₦)'),
          N('pos', 'POS (₦)'),
          N('cash', 'Cash (₦)'),
          N('payers_n', 'Number of parents who paid'),
          Y('confirmed_bank', 'Payments confirmed against bank statement / alert'),
          Y('receipts_issued', 'Receipts issued for all payments'),
          Y('platforms_updated', 'Payments updated on Eschool / Klacify / Tufee'),
          yn('cash_lodged', 'Cash lodged to bank', 'yes', 'Amount (₦)'),
          L('unconfirmed', 'Unconfirmed / unidentified payments (parent, amount, date)'),
        ],
      },
      {
        title: 'Part C: Fees follow-up',
        fields: [
          N('debtors_contacted', 'Number of debtors contacted today'),
          L('reminders', 'Payment reminders sent (SMS / WhatsApp / call)'),
          L('promises', 'Payment promises received (parent, learner, class, amount ₦, promised date)'),
          L('plans', 'Instalment / payment plan requests (parent, learner, details)'),
          L('policy_affected', 'Learners affected by fees policy today (name, class, action taken)'),
        ],
      },
      {
        title: 'Part D: Expenses and petty cash',
        fields: [
          N('petty_open', 'Petty cash opening balance (₦)'),
          L('expenses', 'Expenses paid today (item, amount ₦, approved by)'),
          Y('vouchers', 'Receipts / vouchers collected for all expenses'),
          N('petty_close', 'Petty cash closing balance (₦)'),
        ],
      },
      {
        title: 'Part E: Facilities and support staff',
        fields: [
          L('support_attendance', 'Support staff attendance (cleaners, security, drivers, kitchen)'),
          L('support_absent', 'Absent support staff (name, role, reason)'),
          L('facility_issues', 'Facility issues reported (location, issue)'),
          L('repairs', 'Repairs / maintenance done today'),
          yn('power', 'Power / generator / water issues', 'yes', 'Details'),
          yn('transport', 'School bus / transport issues', 'yes', 'Details'),
        ],
      },
      {
        title: 'Part F: Admin office',
        fields: [
          L('complaints', "Parents' complaints escalated by Admin Secretary"),
          L('handled', 'How did you handle it?'),
          L('supplies', 'Stationery / supplies requested or issued'),
          L('pending', 'Pending tasks carried over to tomorrow'),
        ],
      },
      closing,
    ],
  },

  operations_manager_weekly: {
    key: 'operations_manager_weekly',
    title: 'Operations Manager: Weekly Report',
    frequency: 'weekly',
    reportsTo: 'Director',
    sections: [
      { title: 'Term', fields: [{ id: 'week_of_term', type: 'number', label: 'Week of term', optional: true }] },
      {
        title: 'Part A: Fees collection summary',
        fields: [
          N('expected', 'Total fees expected for the term (₦)'),
          N('collected_total', 'Total collected to date (₦)'),
          N('collected_week', 'Collected this week (₦)'),
          NO('percent', 'Percentage collected to date (%)'),
          N('outstanding', 'Outstanding balance (₦)'),
          NO('nursery', 'Collection: Nursery (₦)'),
          NO('primary', 'Collection: Primary (₦)'),
          NO('academy', 'Collection: Academy (₦)'),
        ],
      },
      {
        title: 'Part B: Debtors',
        fields: [
          N('debtors_n', 'Number of debtors'),
          L('top_debtors', 'Top debtors (learner, class, amount owed ₦, last contact)'),
          L('promises_due', 'Payment promises due next week (parent, amount ₦, date)'),
          L('broken', 'Broken promises this week (parent, amount ₦)'),
          L('approved_plans', 'Approved payment plans (parent, learner, terms)'),
        ],
      },
      {
        title: 'Part C: Reconciliation',
        fields: [
          Y('reconciled', 'All payments reconciled with bank statement'),
          L('unidentified', 'Unidentified payments still pending (amount ₦, date)'),
          Y('receipts_match', 'Receipts issued match payments received'),
          Y('platform_ok', 'Platform records up to date'),
        ],
      },
      {
        title: 'Part D: Expenses',
        fields: [
          N('expenses_total', 'Total expenses this week (₦)'),
          L('major', 'Major expenses (item, amount ₦)'),
          N('petty_end', 'Petty cash balance at week end (₦)'),
          yn('unapproved', 'Items purchased without prior approval', 'yes', 'Details'),
        ],
      },
      {
        title: 'Part E: Facilities and support staff',
        fields: [
          L('repairs_done', 'Repairs completed this week'),
          L('repairs_pending', 'Repairs still pending (issue, since when)'),
          L('staff_concerns', 'Support staff concerns (name, role, issue)'),
          L('vendor', 'Vendor / supplier issues'),
        ],
      },
      {
        title: 'Part F: Admin office',
        fields: [
          Y('as_weekly_reviewed_np', "Admin Secretary's (Nursery & Primary) weekly report reviewed"),
          Y('as_weekly_reviewed_sec', "Admin Secretary's (Secondary) weekly report reviewed"),
          L('enquiries_vs', 'Enquiries vs enrolments this week'),
          L('complaints_open', "Parents' complaints still open"),
        ],
      },
      {
        title: 'Staff records and clock-in compliance',
        fields: [
          yn('clock_in', 'Full clock-in and clock-out compliance this week', 'no', 'Staff member(s) not compliant'),
          yn('leave_email', 'All permission and leave requests received by email', 'no', 'Received verbally / WhatsApp from'),
          yn('records_change', 'Any change in staff records (new joining, departure, change in status)', 'yes', 'Details'),
        ],
      },
      {
        title: 'Communications compliance',
        fields: [
          LS('comms_sent', 'Official school communications sent this week (letters, notices, parent letters)'),
          yn('comms_unapproved', 'Any communication sent without Director approval that should have been approved', 'yes', 'Details'),
        ],
      },
      {
        title: 'Part G: Look ahead',
        fields: [
          L('fees_drive', 'Planned fees drive next week'),
          NO('expected_expenses', 'Expected expenses next week (₦)'),
          L('resources', 'Resources needed'),
        ],
      },
      closing,
    ],
  },

  head_of_school_daily: {
    key: 'head_of_school_daily',
    title: 'Head of School: Daily Report',
    frequency: 'daily',
    reportsTo: 'Director',
    sections: [
      {
        title: 'Part A: Staff attendance and cover',
        fields: [
          N('staff_absent_n', 'Number of staff absent'),
          LS('absent_names', 'Names and reasons for absence'),
          N('late_n', 'Number of staff late'),
          LS('late_names', 'Names of late staff'),
          Y('cover_arranged', 'Cover arranged for absent teachers'),
          L('cover_details', 'Class(es) covered and by whom'),
        ],
      },
      {
        title: 'Part B: Teaching and learning',
        fields: [
          N('notes_expected', 'Lesson notes expected'),
          N('notes_submitted', 'Lesson notes submitted'),
          N('notes_approved', 'Lesson notes approved'),
          LS('notes_yet', 'Names of teachers yet to submit'),
          L('classes_visited', 'Classes visited / observed today'),
          L('remarks', 'Brief remarks on lessons observed'),
          yn('no_teacher', 'Any class left without a teacher at any point', 'yes', 'Class and reason'),
        ],
      },
      {
        title: "Part C: Learners' welfare and discipline",
        fields: [
          Y('attendance_marked', "Learners' attendance confirmed marked on Tufee by teachers"),
          L('discipline', 'Discipline incidents (name, class, incident)'),
          L('action_taken', 'Action taken'),
          L('sick_injured', 'Learners sick or injured in school (name, class)'),
          YO('parents_informed', 'Parents informed'),
        ],
      },
      {
        title: 'Part D: Parents and escalations',
        fields: [
          L('complaints', 'Academic complaints / enquiries from parents'),
          L('handled', 'How did you handle it?'),
          L('pending', 'Pending issues carried over to tomorrow'),
        ],
      },
      closing,
    ],
  },

  head_of_school_weekly: {
    key: 'head_of_school_weekly',
    title: 'Head of School: Weekly Report',
    frequency: 'weekly',
    reportsTo: 'Director',
    sections: [
      { title: 'Term', fields: [{ id: 'week_of_term', type: 'number', label: 'Week of term', optional: true }] },
      {
        title: 'Part A: Curriculum coverage',
        fields: [
          L('on_track', 'Classes on track with scheme of work'),
          L('behind', 'Classes behind (class, subject, reason)'),
          L('catch_up', 'Plan to catch up'),
        ],
      },
      {
        title: 'Part B: Assessment',
        fields: [
          L('tests_given', 'Tests / CAs given this week (class, subject)'),
          Y('marked', 'Marked and recorded'),
          Y('uploaded', 'Scores uploaded on Eschool / Klacify'),
          L('outstanding_marking', 'Outstanding marking (teacher, class)'),
        ],
      },
      {
        title: 'Part C: Learners needing support',
        fields: [
          L('flagged', 'Learners flagged this week (name, class, concern)'),
          L('intervention', 'Intervention started'),
          YO('parents_contacted', 'Parents contacted'),
        ],
      },
      {
        title: 'Part D: Staff performance',
        fields: [
          L('observations', 'Lesson observations done this week'),
          L('commended', 'Teachers commended (name, reason)'),
          L('needs_support', 'Teachers needing support (name, area)'),
          T('notes_rate', 'Lesson notes submission rate this week'),
          yn('training', 'Staff training / briefing held', 'yes', 'Topic'),
        ],
      },
      {
        title: 'Part E: Look ahead',
        fields: [L('next_week', 'Academic activities next week'), L('resources', 'Resources / materials needed')],
      },
      closing,
    ],
  },

  vice_principal_daily: {
    key: 'vice_principal_daily',
    title: 'Vice Principal: Daily Report',
    frequency: 'daily',
    reportsTo: 'Director',
    sections: [
      {
        title: "Part A: Students' attendance and punctuality",
        fields: [
          N('absentees_n', 'Number of absentees'),
          LS('absentees_names', 'Names and classes of absentees'),
          YO('parents_contacted', 'Parents contacted'),
          N('latecomers_n', 'Number of latecomers'),
          LS('repeat_late', 'Names of repeat latecomers (3+ times this term)'),
          Y('attendance_marked', "Learners' attendance confirmed marked on Tufee"),
        ],
      },
      {
        title: 'Part B: Staff attendance and cover',
        fields: [
          N('staff_absent_n', 'Number of staff absent'),
          LS('staff_absent_names', 'Names and reasons for absence'),
          L('periods_missed', 'Periods missed (class, subject)'),
          yn('cover_provided', 'Cover provided', 'yes', 'By whom'),
          yn('no_teacher', 'Any class left without a teacher at any point', 'yes', 'Class and reason'),
        ],
      },
      {
        title: 'Part C: Discipline',
        fields: [
          L('cases', 'Discipline cases (name, class, offence)'),
          L('sanction', 'Sanction given'),
          YO('parents_contacted_disc', 'Parents contacted'),
          YO('referred', 'Cases referred to Director'),
        ],
      },
      {
        title: 'Part D: Daily routine',
        fields: [
          Y('assembly', 'Morning assembly held'),
          Y('duty_present', 'Teachers on duty present'),
          Y('dismissal', 'Dismissal orderly'),
          L('routine_remarks', 'Remarks'),
        ],
      },
      {
        title: 'Scheme of work compliance (Mondays)',
        days: [1],
        fields: [
          list('plans_checked', 'Teachers whose lesson plans were cross-checked against the scheme today'),
          L('discrepancies', 'Discrepancies found (teacher, subject, what was planned vs what the scheme requires)'),
          yn('project_work', 'Project work appeared in lesson plans where the scheme requires it', 'no', 'Missing in these subjects'),
        ],
      },
      {
        title: 'Classroom visit',
        fields: [
          text('visited', 'Teacher / class visited'),
          text('subject', 'Subject being taught'),
          checks('quality', 'Teaching quality observed (tick what applied)', [
            'Prepared and on-scheme',
            'Students actively engaged',
            'Board well-organised',
            'Lesson plan visible',
            'Teacher unprepared',
            'Dictating from textbook',
            'Students passive',
            'Phone in use',
          ]),
          L('visit_notes', 'Notes from visit'),
        ],
      },
      {
        title: 'Class captain check-in (Mondays)',
        days: [1],
        fields: [
          list('captains', 'Captains spoken to today (class and captain name)'),
          L('captain_reports', 'Notable reports from class captains (lessons disrupted, materials issues, attendance gaps)'),
        ],
      },
      {
        title: 'Diary check (Fridays)',
        days: [5],
        fields: [
          list('diary_submitted', 'Part-time teachers who submitted diary entries for the week'),
          LS('diary_missing', 'Part-time teachers with missing or incomplete diary entries'),
          choice('diary_gaps', 'Diary result', [
            'All submitted, no gaps',
            'Gaps found: Director informed before 5 PM',
            'Gaps found: Director not yet informed',
          ]),
        ],
      },
      {
        title: 'Part E: Parents',
        fields: [L('complaints', 'Complaints / enquiries from parents'), L('handled', 'How did you handle it?')],
      },
      closing,
    ],
  },

  vice_principal_weekly: {
    key: 'vice_principal_weekly',
    title: 'Vice Principal: Weekly Report',
    frequency: 'weekly',
    reportsTo: 'Director',
    sections: [
      { title: 'Term', fields: [{ id: 'week_of_term', type: 'number', label: 'Week of term', optional: true }] },
      {
        title: 'Part A: Syllabus coverage',
        fields: [
          L('on_track', 'Subjects on track'),
          L('behind', 'Subjects behind (class, subject, teacher, reason)'),
          L('catch_up', 'Plan to catch up'),
        ],
      },
      {
        title: 'Part B: Assessment and performance',
        fields: [
          L('tests', 'Tests / CAs given this week (class, subject)'),
          Y('recorded', 'Scores recorded and uploaded'),
          L('weakest', 'Weakest subjects this week (class, subject)'),
          L('support', 'Learners needing academic support (name, class)'),
        ],
      },
      {
        title: 'Part C: External examinations',
        fields: [
          T('exams', 'Exam(s) in view (WAEC / NECO / BECE / JAMB)'),
          L('registration', 'Registration progress'),
          L('preparation', 'Preparation activities held (extra classes, mock tests)'),
        ],
      },
      {
        title: 'Part D: Attendance and discipline summary',
        fields: [
          N('absentees_total', 'Total absentees for the week'),
          L('repeat_absentees', 'Repeat absentees (3+ days)'),
          N('discipline_total', 'Total discipline cases'),
          L('offenders', 'Recurring offenders (name, class)'),
        ],
      },
      {
        title: 'Part E: Staff',
        fields: [
          L('punctuality', 'Staff punctuality concerns'),
          T('notes_rate', 'Lesson notes submission rate'),
          Y('senior_teacher_report', "Senior Teacher's report received"),
          L('commended', 'Teachers commended (name, reason)'),
        ],
      },
      {
        title: 'Part F: Student life',
        fields: [L('clubs', 'Clubs / societies activities held'), L('prefects', "Prefects' feedback")],
      },
      {
        title: 'Part G: Look ahead',
        fields: [L('plans', 'Plans for next week'), L('resources', 'Resources needed')],
      },
      closing,
    ],
  },

  admin_secretary_daily: {
    key: 'admin_secretary_daily',
    title: 'Admin Secretary: Daily Report',
    frequency: 'daily',
    reportsTo: 'Director',
    sections: [
      {
        title: 'Part A: Absentees',
        fields: [
          N('absentees_n', 'Number of absentees'),
          N('contacted_n', 'Total number contacted'),
          N('unreachable_n', 'Unreachable (SMS sent)'),
          LS('absentee_names', 'Names and reasons for absentees'),
          L('action_taken', 'Action taken'),
          L('feedback', 'Special feedback for management attention'),
        ],
      },
      {
        title: 'Part B: Daily attendance, new borns and birthdays',
        fields: [
          Y('staff_attendance', 'Staff attendance marked on Tufee'),
          Y('learners_attendance', "Learners' attendance confirmed marked on Tufee by teachers"),
          YO('birthday_sms', "Birthday celebrant(s)' SMS sent and picture posted"),
          T('newborn_family', 'Name of new born family'),
          YO('newborn_sms', 'New born SMS sent'),
        ],
      },
      {
        title: 'Part C: New enrolment (only if there was one today)',
        fields: [
          LS('enrolled_names', 'Name(s)'),
          T('enrolled_classes', 'Class(es)'),
          checks('platforms', 'Platforms registered on', ['Eschool', 'Klacify', 'Tufee']),
          YO('admission_register', 'Admission register'),
          YO('bulk_sms', 'Bulk SMS platform'),
          YO('whatsapp', 'General WhatsApp platforms and class platform'),
          YO('tufee_form', 'Tufee registration form sent to parents and dropped on admin platform'),
          YO('form_checked', 'Online form properly checked'),
          YO('birth_cert', 'Birth certificate collected'),
        ],
      },
      {
        title: 'Part D: Enquiries and visitors',
        fields: [
          N('enquiries_n', 'Number of admission enquiries (walk-in / call / WhatsApp)'),
          L('prospects', 'Prospective parents (name, phone, class sought, follow-up date)'),
          N('visitors_n', 'Number of visitors received'),
          L('visitors', 'Visitors (name, purpose, person seen)'),
        ],
      },
      {
        title: 'Part E: Withdrawals and records',
        fields: [
          L('withdrawn', 'Learner(s) withdrawn / transferring (name, class, reason)'),
          YO('exit_updated', 'Exit records updated on all platforms'),
          { id: 'fee_referred', type: 'yesno', label: 'Fee-related enquiries referred to Bursar / OPM', detail: { on: 'yes', label: 'How many?' }, optional: true },
        ],
      },
      {
        title: 'Part F: Communications and pending tasks',
        fields: [
          L('circulars', 'Circulars / bulk SMS / reminders sent today (topic)'),
          L('pending', 'Pending tasks carried over to tomorrow'),
        ],
      },
      {
        title: 'Parents',
        fields: [L('complaints', 'Any complaints from any parents?'), L('handled', 'How did you handle it?')],
      },
      closing,
    ],
  },

  admin_secretary_weekly: {
    key: 'admin_secretary_weekly',
    title: 'Admin Secretary: Weekly Report',
    frequency: 'weekly',
    reportsTo: 'Director',
    sections: [
      { title: 'Term', fields: [{ id: 'week_of_term', type: 'number', label: 'Week of term', optional: true }] },
      {
        title: 'Part A: Attendance summary',
        fields: [
          N('absentees_total', 'Total absentees for the week'),
          L('repeat_absentees', 'Repeat absentees, 3+ days (name, class, reason)'),
          YO('repeat_contacted', 'Parents of repeat absentees contacted'),
        ],
      },
      {
        title: 'Part B: Enquiries and enrolment',
        fields: [
          N('enquiries_n', 'Total admission enquiries this week'),
          N('converted_n', 'Number converted to enrolment'),
          L('enrolled', 'New learners enrolled (name, class)'),
          L('followups', 'Prospective parents still being followed up'),
        ],
      },
      {
        title: 'Part C: Records outstanding',
        fields: [
          L('birth_certs', 'Birth certificates not yet collected (name, class)'),
          L('forms_unchecked', 'Online forms not yet checked'),
          L('not_on_platforms', 'Learners not yet on all platforms (Eschool / Klacify / Tufee)'),
          L('withdrawals', 'Withdrawals this week'),
          YO('withdrawals_updated', 'Withdrawal records updated'),
        ],
      },
      {
        title: "Part D: Parents' complaints",
        fields: [
          N('complaints_received', 'Complaints received this week'),
          N('complaints_resolved', 'Complaints resolved'),
          L('complaints_open', 'Complaints still open (parent, issue, status)'),
        ],
      },
      {
        title: 'Part E: Communications',
        fields: [
          N('birthday_sms_n', 'Birthday SMS sent this week (number)'),
          N('newborn_sms_n', 'New born SMS sent this week (number)'),
          L('circulars', 'Circulars / bulk SMS sent this week (topics)'),
        ],
      },
      closing,
    ],
  },

  staff_on_duty: {
    key: 'staff_on_duty',
    title: 'Staff on Duty: Daily Report',
    frequency: 'daily',
    onRequest: true,
    reportsTo: 'Head of School or Vice Principal',
    sections: [
      { title: 'Part A: Duty details', fields: [T('time_resumed', 'Time resumed for duty')] },
      {
        title: 'Part B: Morning arrival',
        fields: [
          Y('gate', 'School gate opened and manned on time'),
          Y('supervised_arrival', 'Learners received and supervised at arrival'),
          N('latecomers_n', 'Number of latecomers'),
          LS('latecomers', 'Names and classes of latecomers'),
          L('uniform', 'Learners not in proper uniform (name, class, issue)'),
          Y('assembly', 'Morning assembly held on time'),
          L('assembly_remarks', 'Remarks on assembly'),
        ],
      },
      {
        title: 'Part C: Environment and safety',
        fields: [
          Y('classrooms', 'Classrooms clean and ready before lessons'),
          Y('toilets', 'Toilets clean and usable'),
          Y('compound', 'Compound clean'),
          L('hazards', 'Safety hazards noticed (location, issue)'),
          T('reported_to', 'Reported to'),
        ],
      },
      {
        title: 'Part D: Break time',
        fields: [
          Y('break_supervised', 'Break supervised'),
          T('areas', 'Areas covered (field, canteen, corridors)'),
          Y('feeding', 'Learners eating properly / feeding supervised'),
          L('break_incidents', 'Incidents during break (name, class, incident)'),
          L('break_action', 'Action taken'),
        ],
      },
      {
        title: "Part E: Learners' welfare",
        fields: [
          L('sick', 'Learners sick or injured (name, class, complaint)'),
          YO('first_aid', 'First aid given'),
          YO('parents_informed', 'Parents informed'),
          L('discipline', 'Discipline cases handled (name, class, offence, action taken)'),
        ],
      },
      {
        title: 'Part F: Dismissal',
        fields: [
          Y('dismissal', 'Dismissal orderly'),
          Y('authorised', 'Learners handed over only to known / authorised persons'),
          L('late_pickups', 'Learners picked up late (name, class, time picked)'),
          L('still_in_school', 'Learners still in school after closing (name, class)'),
          Y('locked', 'Classrooms locked and lights / fans switched off'),
        ],
      },
      {
        title: 'Part G: Visitors and parents',
        fields: [
          L('visitors', 'Visitors / parents who came during duty (name, purpose)'),
          YO('directed_admin', 'Directed to Admin'),
        ],
      },
      {
        title: 'Other',
        fields: [
          L('observation', 'Any other observation?'),
          L('director_issues', "Any issues for Director's attention?"),
          L('support_needed', 'Support needed?'),
        ],
      },
    ],
  },
};

// Which reports each role fills in. Daily and weekly are separate reports.
export const ROLE_REPORTS: Record<string, string[]> = {
  senior_teacher: ['senior_teacher'],
  vice_principal: ['vice_principal_daily', 'vice_principal_weekly'],
  primary_unit_leader: ['primary_unit_leader'],
  nursery_unit_leader: ['nursery_unit_leader'],
  operations_manager: ['operations_manager_daily', 'operations_manager_weekly'],
  head_of_school: ['head_of_school_daily', 'head_of_school_weekly'],
  admin_secretary: ['admin_secretary_daily', 'admin_secretary_weekly'],
  teacher: [],
};

const DUTY_ROLES = ['teacher', 'senior_teacher'];

// Reports a person is expected to submit (reminders, "Missing" marks).
export const expectedFor = (role: string): Template[] =>
  (ROLE_REPORTS[role] ?? []).map((k) => TEMPLATES[k]).filter(Boolean);

// Everything a person can open: expected reports, plus the duty report for teachers.
export const reportsFor = (role: string): Template[] => [
  ...expectedFor(role),
  ...(DUTY_ROLES.includes(role) ? [TEMPLATES.staff_on_duty] : []),
];
