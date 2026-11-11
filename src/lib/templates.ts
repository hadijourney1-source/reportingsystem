// The six report templates from "Staff Accountability Reporting Templates, 2026/2027".
// To change a question, edit it here. No database change needed.

export type Field =
  | { id: string; type: 'yesno'; label: string; detail?: { on: 'yes' | 'no'; label: string }; optional?: boolean }
  | {
      id: string;
      type: 'text' | 'long' | 'number' | 'date' | 'list';
      label: string;
      optional?: boolean;
      requiredWhen?: { ids: string[]; value: 'Yes' | 'No' | 'Filled' };
    }
  | {
      id: string;
      type: 'choice' | 'checks';
      label: string;
      options: string[];
      optional?: boolean;
      requiredWhen?: { ids: string[]; value: 'Yes' | 'No' | 'Filled' };
    };

export type Section = { title: string; days?: number[]; fields: Field[] }; // days: 1=Mon ... 5=Fri

export type Template = {
  key: string;
  title: string;
  frequency: 'daily' | 'weekly';
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

// A details box that must be filled in when any linked answer equals `value`
// ('Filled' = the linked box has any text in it).
const need = (f: Field, ids: string[], value: 'Yes' | 'No' | 'Filled' = 'Yes'): Field =>
  ({ ...f, requiredWhen: { ids, value } }) as Field;

export function mustFill(f: Field, answers: Record<string, string | string[]>): boolean {
  if (!('requiredWhen' in f) || !f.requiredWhen) return false;
  const { ids, value } = f.requiredWhen;
  return ids.some((id) => {
    const a = answers[id];
    return value === 'Filled' ? typeof a === 'string' && a.trim() !== '' : a === value;
  });
}

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
          yn('latecomers_duty', 'Latecomers duty enforced'),
        ],
      },
      {
        title: 'B. Midday classroom walkthrough',
        fields: [
          list('classrooms_visited', 'Classrooms visited during walkthrough'),
          long('unusual', 'Anything unusual observed (student behaviour, teacher absence, noise, etc.)', true),
          choice('captain_logs', 'Class captain logs', [
            'All classes: entries present',
            'Gaps found',
          ]),
          list('gap_classes', 'Classes with gaps (if any)', true),
          choice('dear_time', 'DEAR time was held', ['Yes', 'No', 'Not applicable today']),
          yn('notes_checked', "Any students' notes checked (one or two classes per day)"),
          need(long('notes_observations', 'Which class, and your observations', true), ['notes_checked']),
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
    frequency: 'daily',
    reportsTo: 'Head of School',
    sections: [
      {
        title: 'A. Day summary',
        fields: [
          choice('tone', 'Overall tone of the primary unit today', [
            'Excellent: all systems running',
            'Good: minor issues managed',
            'Challenging: escalation needed',
          ]),
        ],
      },
      {
        title: 'B. Teaching and learning',
        fields: [
          list('observations', 'Lesson observations conducted today (teacher, class, brief finding)'),
          yn('scheme_ok', 'All teaching was on-scheme today', 'no', 'Concerns found'),
          yn('plans_ok', 'Lesson plans submitted by all primary teachers', 'no', 'Missing from'),
        ],
      },
      {
        title: 'C. Student performance and intervention',
        fields: [
          long('intervention', 'Critical and High Intervention students: update on each today'),
          long('new_concerns', 'New students showing academic concern, not previously flagged', true),
          need(long('new_concerns_action', 'What was done about it?', true), ['new_concerns'], 'Filled'),
        ],
      },
      {
        title: 'D. Student conduct',
        fields: [
          long('discipline', 'Discipline incidents today'),
          long('patterns', 'Patterns observed in student behaviour, positive or negative', true),
        ],
      },
      {
        title: 'E. Teacher conduct and welfare',
        fields: [
          yn('teacher_concern', 'Any teacher conduct concern today (lateness, phone use, language, preparation)'),
          need(long('welfare', "Details of the concern (teacher's name and class)", true), ['teacher_concern']),
        ],
      },
      {
        title: 'F. Parent and community interactions',
        fields: [long('parents', 'Parent interactions of note today (positive or concerning)')],
      },
      {
        title: "G. Tomorrow's priorities",
        fields: [list('priorities', 'The three most important things to focus on in the primary unit tomorrow')],
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
    frequency: 'daily',
    reportsTo: 'Head of School',
    sections: [
      {
        title: 'A. Day summary',
        fields: [
          choice('tone', 'Overall tone of the nursery unit today', [
            'Excellent: settled and on-routine',
            'Good: minor issues managed',
            'Challenging: needs attention',
          ]),
        ],
      },
      {
        title: 'B. Child welfare and safeguarding',
        fields: [
          yn('welfare_concern', 'Any child welfare concern observed today (physical, emotional or social)'),
          yn('foundational', 'Any child showing signs of early foundational difficulty (language, motor, attention, social)'),
          need(long('welfare_details', 'Details and observations (name and class of each child)', true), ['welfare_concern', 'foundational']),
        ],
      },
      {
        title: 'C. Assessment and learning',
        fields: [
          long('progress', 'Any child whose learning progress is notably behind or ahead of peers', true),
          yn('dear_time', 'Water break followed as timetabled'),
        ],
      },
      {
        title: 'D. Routines and daily structure',
        fields: [
          checks('routines', 'Class routines consistently in place (tick all that apply)', [
            'Assembly time routine',
            'Toilet time routine',
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
          yn('staff_concern', 'Any staff conduct concern in the nursery today'),
          need(long('staff_support', 'Details of the concern (staff name and class)', true), ['staff_concern']),
        ],
      },
      {
        title: 'F. Parent engagement',
        fields: [
          long('parent_feedback', 'Any parent concern or feedback relayed to the unit', true),
        ],
      },
      {
        title: 'Weekly review (Fridays)',
        days: [5],
        fields: [
          Y('review_held', 'Did review hold this week?'),
          need(L('review_why', 'If no, why?'), ['review_held'], 'No'),
        ],
      },
      {
        title: "G. Tomorrow's priorities",
        fields: [list('priorities', 'The three most important things for the nursery unit tomorrow')],
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
          Y('confirmed_bank', 'Payments confirmed against bank statement / alert'),
          Y('receipts_issued', 'Receipts issued for all payments'),
          L('unconfirmed', 'Unconfirmed / unidentified payments (parent, amount, date)'),
        ],
      },
      {
        title: 'Part C: Fees follow-up',
        fields: [
          N('debtors_contacted', 'Number of debtors contacted today'),
          L('reminders', 'Payment reminders sent (SMS / WhatsApp / call)'),
        ],
      },
      {
        title: 'Part E: Facilities and support staff',
        fields: [
          L('support_absent', 'Absent support staff (name, role, reason)'),
          L('facility_issues', 'Facility issues reported (location, issue)'),
          L('repairs', 'Repairs / maintenance done today'),
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
        title: 'Part B: Debtors',
        fields: [
          N('debtors_n', 'Number of debtors'),
          L('promises_due', 'Payment promises due next week (parent, amount ₦, date)'),
          L('approved_plans', 'Approved payment plans on email (parent, learner, terms)'),
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
          L('unapproved', 'Items purchased without prior plan / approval (Yes/No, details)'),
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
          yn('leave_email', 'All permission and requests received by email', 'no', 'Received verbally / WhatsApp from'),
        ],
      },
      {
        title: 'Communications compliance',
        fields: [
          LS('comms_sent', 'Official school communications sent this week (letters, notices, parent letters)'),
          yn('comms_unapproved', 'Any communication sent without Director approval that should have been approved', 'yes', 'Details'),
        ],
      },
      closing,
    ],
  },

  head_of_school: {
    key: 'head_of_school',
    title: 'Head of School: Accountability Report',
    frequency: 'weekly',
    reportsTo: 'Director',
    sections: [
      {
        title: 'A. Whole-school academic overview',
        fields: [
          choice('health', 'Overall academic health of the school this week', [
            'Strong: all units performing well',
            'Satisfactory: minor concerns managed',
            'Concerning: requires Director attention',
          ]),
          long('observation', 'Key academic observation from this week (one sentence)'),
        ],
      },
      {
        title: 'B. Secondary school (VP report summary)',
        fields: [
          yn('sec_scheme', 'Scheme of work compliance, secondary: all on-scheme', 'no', 'Subject(s) with a gap'),
          long('sec_visit', 'Classroom visit findings this week: most significant observation'),
          long('sec_cbt', 'CBT performance update: any student or subject of concern', true),
          long('sec_intervention', 'Intervention students: update on Critical and High tier this week', true),
        ],
      },
      {
        title: 'C. Primary school (Primary Unit Leader report summary)',
        fields: [
          choice('pri_quality', 'Teaching quality, primary unit this week', ['Good', 'Needs attention', 'Concern escalated']),
          long('pri_concern', 'Student performance concern: any class or child flagged this week', true),
          yn('pri_staff', 'Any staff conduct or welfare matter from primary this week', 'yes', 'Details'),
        ],
      },
      {
        title: 'D. Nursery unit (Nursery Unit Leader report summary)',
        fields: [
          yn('nur_welfare', 'Any child welfare concern flagged this week', 'yes', 'Details'),
          long('nur_assessment', 'Assessment and learning, nursery this week', true),
          yn('nur_routines', 'Routines consistent across the nursery unit', 'no', 'Gaps'),
        ],
      },
      {
        title: 'E. Teaching quality across the school',
        fields: [
          list('teachers_observed', 'Teachers observed this week across all units (name, unit, one-line finding)'),
          long('commendable', 'Teacher whose performance was most commendable this week, and why'),
          long('needs_attention', 'Teacher whose performance requires attention, and what action was taken'),
        ],
      },
      {
        title: 'F. Culture and GRICE values',
        fields: [
          long('grice_example', 'Evidence of GRICE values being lived this week (specific example observed)'),
          choice('grice_value', 'GRICE value that needs the most attention across the school right now', [
            'Gratitude',
            'Respect',
            'Integrity',
            'Compassion',
            'Excellence',
          ]),
          long('grice_action', 'Action being taken to address it'),
        ],
      },
      {
        title: 'G. Whole-school priorities for next week',
        fields: [list('priorities', 'The three most important academic or operational priorities for the school next week')],
      },
      {
        title: 'Daily reports from your team',
        fields: [
          Y('review_primary', "Primary Unit Leader's daily reports for this week received and reviewed"),
          Y('review_nursery', "Nursery Unit Leader's daily reports for this week received and reviewed"),
          Y('review_duty', 'Staff on Duty reports (Nursery & Primary) for this week received and reviewed'),
        ],
      },
      {
        title: 'Escalations, conduct and complaints',
        fields: [
          Y('esc_received', 'Any escalations received from the Primary or Nursery Unit Leader this week?'),
          need(L('esc_details', 'What were they, and what was done about them?'), ['esc_received']),
          Y('conduct_raised', 'Any staff conduct concerns raised by the unit leaders this week?'),
          need(L('conduct_details', 'Which staff (name and class), and what action was taken?'), ['conduct_raised']),
          Y('duty_issues', 'Any recurring issues from the Staff on Duty reports this week (safety hazards, late pickups, incidents)?'),
          need(L('duty_details', 'What were they, and what was done about them?'), ['duty_issues']),
          Y('parent_complaints', 'Any parent complaints from primary or nursery this week?'),
          need(L('complaint_details', 'What was the complaint, and how was it handled?'), ['parent_complaints']),
        ],
      },
      {
        title: 'H. Matters requiring Director decision',
        fields: [
          long('director_decisions', 'Decisions, approvals or escalations the Director needs to make this week (write N/A if none)'),
          choice('overall', 'Head of School overall assessment of the school this week', [
            'On track: culture and systems holding',
            'Some drift: needs closer attention next week',
            'Significant concern: urgent Director review needed',
          ]),
        ],
      },
    ],
  },

  vice_principal_daily: {
    key: 'vice_principal_daily',
    title: 'Vice Principal: Daily Report',
    frequency: 'daily',
    reportsTo: 'Director',
    sections: [
      {
        title: 'ASP',
        fields: [
          Y('asp_held', 'Did ASP hold today?'),
          need(L('asp_missed', 'How many students did not wait for the ASP? (number, names and classes)'), ['asp_held']),
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
          Y('marked', 'Marked and recorded'),
          Y('uploaded', 'Scores uploaded on Eschool / Klacify'),
          L('outstanding_marking', 'Outstanding marking (teacher, class)'),
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
    reportsTo: 'Operations Manager',
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
          choice('birthday_sms', "Birthday celebrant(s)' SMS sent and picture posted", ['Yes', 'No', 'Not applicable / none today']),
          T('newborn_family', 'Name of new born family'),
          choice('newborn_sms', 'New born SMS sent', ['Yes', 'No', 'Not applicable / none today']),
        ],
      },
      {
        title: 'Part C: New enrolment (only if there was one today)',
        fields: [
          LS('enrolled_names', 'Name(s)'),
          T('enrolled_classes', 'Class(es)'),
          checks('platforms_done', 'Platforms registered on', [
            'Klacify',
            'Eschool',
            'Tufee',
            'Admission register',
            'Bulk SMS platform',
            'Class WhatsApp platform',
            'General WhatsApp platform',
          ]),
          YO('tufee_form', 'Tufee registration form sent to parents and dropped on admin platform'),
          YO('form_checked', 'Online form properly checked'),
          YO('birth_cert', 'Birth certificate collected'),
          { id: 'name_matches', type: 'choice', label: 'Name on birth certificate and forms align', options: ['Yes', 'No', 'Parent notified'], optional: true },
        ],
      },
      {
        title: 'Part D: Enquiries and visitors',
        fields: [
          N('enquiries_n', 'Number of admission enquiries (walk-in / call / WhatsApp)'),
          choice('prospects', 'Prospective parents (follow up done on tufee)', ['Yes', 'No', 'Not applicable / none today']),
          need(NO('followed_up_n', 'How many parents were followed up?'), ['prospects']),
          choice('broadcast_list', 'Parent added to broadcast list', ['Yes', 'No', 'Not applicable']),
          N('visitors_n', 'Number of visitors received'),
          L('visitors', 'Visitors (name, purpose, person seen)'),
        ],
      },
      {
        title: 'Part E: Withdrawals and records',
        fields: [
          L('withdrawn', 'Learner(s) withdrawn (name, class, reason)'),
          YO('exit_updated', 'Exit records updated on all platforms in Part C'),
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
      {
        title: 'Staff changes',
        fields: [
          Y('staff_joined', 'Did any new staff join?'),
          need({ id: 'joined_name', type: 'text', label: 'Name of staff', optional: true }, ['staff_joined']),
          need({ id: 'joined_role', type: 'choice', label: 'Role', options: ['Academic', 'Non Academic', 'Corper'], optional: true }, ['staff_joined']),
          need({ id: 'joined_orientation', type: 'choice', label: 'Orientation done', options: ['Yes', 'No'], optional: true }, ['staff_joined']),
          Y('staff_exited', 'Did any staff exit?'),
          need({ id: 'exited_name', type: 'text', label: 'Name of staff', optional: true }, ['staff_exited']),
        ],
      },
      closing,
    ],
  },

  admin_secretary_weekly: {
    key: 'admin_secretary_weekly',
    title: 'Admin Secretary: Weekly Report',
    frequency: 'weekly',
    reportsTo: 'Operations Manager',
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
          L('name_mismatch', 'Name on certificate not the same as on form (name, class)'),
          L('forms_unchecked', 'Online forms not yet checked'),
          L('not_on_platforms', 'Learners not yet on all platforms (name, pending platform: Eschool / Klacify / Tufee)'),
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

// Asked on every report.
const SOCIAL = checks(
  'social_comment',
  'Have you commented on any of our social media pages today? Pick the platform you commented on',
  ['TikTok', 'Facebook', 'Instagram'],
);
for (const t of Object.values(TEMPLATES)) t.sections.push({ title: 'Social media', fields: [SOCIAL] });

// Which reports each role fills in. Daily and weekly are separate reports.
export const ROLE_REPORTS: Record<string, string[]> = {
  senior_teacher: ['senior_teacher'],
  vice_principal: ['vice_principal_daily', 'vice_principal_weekly'],
  primary_unit_leader: ['primary_unit_leader'],
  nursery_unit_leader: ['nursery_unit_leader'],
  operations_manager: ['operations_manager_daily', 'operations_manager_weekly'],
  head_of_school: ['head_of_school'],
  admin_secretary: ['admin_secretary_daily', 'admin_secretary_weekly'],
  // Two shared logins (Nursery & Primary, Secondary) file the daily duty report.
  staff_on_duty: ['staff_on_duty'],
};

// These shared logins sign in by tapping the name; no PIN.
export const NO_PIN_ROLES = ['staff_on_duty'];

// Reports a person is expected to submit (reminders, "Missing" marks).
export const expectedFor = (role: string): Template[] =>
  (ROLE_REPORTS[role] ?? []).map((k) => TEMPLATES[k]).filter(Boolean);

// Everything a person can open.
export const reportsFor = (role: string): Template[] => expectedFor(role);
