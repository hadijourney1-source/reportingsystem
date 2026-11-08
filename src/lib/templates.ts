// The six report templates from "Staff Accountability Reporting Templates, 2026/2027".
// To change a question, edit it here. No database change needed.

export type Field =
  | { id: string; type: 'yesno'; label: string; detail?: { on: 'yes' | 'no'; label: string } }
  | { id: string; type: 'text' | 'long' | 'number' | 'date' | 'list'; label: string; optional?: boolean }
  | { id: string; type: 'choice' | 'checks'; label: string; options: string[]; optional?: boolean };

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

const flag = long('director_flag', 'Flag for Director (write N/A if nothing to flag)');

const weekSummary = (unit: string, tones: string[]): Section => ({
  title: 'A. Week summary',
  fields: [
    { id: 'week_commencing', type: 'date', label: 'Week commencing' },
    num('teaching_days', 'Number of teaching days this week'),
    choice('tone', `Overall tone of the ${unit} this week`, tones),
  ],
});

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

  vice_principal: {
    key: 'vice_principal',
    title: 'Vice Principal: Accountability Report',
    frequency: 'daily',
    reportsTo: 'Director',
    sections: [
      {
        title: 'A. Scheme of work compliance (Mondays)',
        days: [1],
        fields: [
          list('plans_checked', 'Teachers whose lesson plans were cross-checked against the scheme today'),
          long('discrepancies', 'Discrepancies found (teacher, subject, what was planned vs what the scheme requires)', true),
          yn('project_work', 'Project work appeared in lesson plans where the scheme requires it', 'no', 'Missing in these subjects'),
        ],
      },
      {
        title: 'B. Classroom visit',
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
          long('visit_notes', 'Notes from visit', true),
        ],
      },
      {
        title: 'C. Class captain check-in (Mondays)',
        days: [1],
        fields: [
          list('captains', 'Captains spoken to today (class and captain name)'),
          long('captain_reports', 'Notable reports from class captains (lessons disrupted, materials issues, attendance gaps)', true),
        ],
      },
      {
        title: 'D. Diary check (Fridays)',
        days: [5],
        fields: [
          list('diary_submitted', 'Part-time teachers who submitted diary entries for the week'),
          list('diary_missing', 'Part-time teachers with missing or incomplete diary entries', true),
          choice('diary_gaps', 'Diary result', [
            'All submitted, no gaps',
            'Gaps found: Director informed before 5 PM',
            'Gaps found: Director not yet informed',
          ]),
        ],
      },
      {
        title: 'E. Discipline and student matters',
        fields: [
          list('discipline_convos', 'First-level discipline conversations held today (student, class, brief description)', true),
          yn('escalated', 'Cases escalated to Director today', 'yes', 'Student name(s)'),
        ],
      },
      { title: 'F. Anything requiring Director attention', fields: [flag] },
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

  operations_manager: {
    key: 'operations_manager',
    title: 'Operations Manager: Accountability Report',
    frequency: 'weekly',
    reportsTo: 'Director',
    sections: [
      {
        title: 'A. Fees and financial administration',
        fields: [
          num('families_outstanding', 'Number of families with outstanding fees this week'),
          long('extension_status', 'Families on approved payment extension: status update', true),
          yn('ext_requests', 'Fee payment extension requests received this week', 'yes', 'How many, and were all submitted by email?'),
          long('fee_concerns', 'Any fee-related parent concern or dispute this week', true),
        ],
      },
      {
        title: 'B. Parent communications and first contact',
        fields: [
          num('parent_interactions', 'Number of parent interactions handled at the office this week'),
          long('parent_queries', 'Parent concerns or queries raised this week (nature and how handled)'),
          yn('difficult_parent', 'Any parent who was difficult, inappropriate, or requires Director awareness', 'yes', 'Name and summary'),
        ],
      },
      {
        title: 'C. Staff records and clock-in compliance',
        fields: [
          yn('clock_in', 'Full clock-in and clock-out compliance this week', 'no', 'Staff member(s) not compliant'),
          yn('leave_email', 'All permission and leave requests received by email', 'no', 'Received verbally / WhatsApp from'),
          yn('records_change', 'Any change in staff records (new joining, departure, change in status)', 'yes', 'Details'),
        ],
      },
      {
        title: 'D. Facilities and materials',
        fields: [
          yn('facility', 'Any facility or maintenance issue reported or observed', 'yes', 'Details and status'),
          yn('supplies', 'Any learning materials or supplies needing replenishment', 'yes', 'Items'),
          yn('damage', 'Any property damage reported this week', 'yes', 'Student, and was the parent contacted?'),
        ],
      },
      {
        title: 'E. Communications compliance',
        fields: [
          list('comms_sent', 'Official school communications sent this week (letters, notices, parent letters)', true),
          yn('comms_unapproved', 'Any communication sent without Director approval that should have been approved', 'yes', 'Details'),
        ],
      },
      {
        title: 'F. Anything requiring Director decision',
        fields: [long('director_decision', 'Matters requiring Director awareness or decision (write N/A if none)')],
      },
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
};
