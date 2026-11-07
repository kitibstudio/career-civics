import type { ActionDef, EventDef, GradeId, Track } from './types'

export const ACTIONS: ActionDef[] = [
  {
    id: 'calc-package',
    name: 'Own a calc package',
    blurb: 'Run the numbers until the design stops arguing with itself.',
    hours: 40,
    tags: ['technical', 'delivery', 'detailed'],
    effects: {
      competence: 6,
      fee: 4,
      projectProgress: 12,
      skill: 'technical',
      stage: 'detailed',
      milestone: 'calcPackage',
    },
  },
  {
    id: 'drawing-set',
    name: 'Issue drawings',
    blurb: 'Sheets, schedules, revisions — make the package real.',
    hours: 48,
    tags: ['delivery', 'detailed', 'tender'],
    effects: {
      competence: 3,
      reputation: 2,
      fee: 6,
      projectProgress: 16,
      skill: 'technical',
      stage: 'detailed',
      milestone: 'drawingSet',
    },
  },
  {
    id: 'design-review',
    name: 'Sit a design review',
    blurb: 'Present the package. Take the red pen seriously.',
    hours: 16,
    tags: ['delivery', 'presenting'],
    effects: {
      competence: 2,
      reputation: 4,
      wellbeing: -1,
      projectProgress: 6,
      skill: 'presenting',
      stage: 'detailed',
      milestone: 'designReview',
      revealFeedback: true,
    },
  },
  {
    id: 'site-visit',
    name: 'Site visit',
    blurb: 'Boots on. Drawings are not the building.',
    hours: 24,
    tags: ['collaboration', 'construction', 'site'],
    effects: {
      competence: 4,
      network: 2,
      wellbeing: 1,
      projectProgress: 5,
      skill: 'coordination',
      stage: 'construction',
      milestone: 'siteVisits',
    },
  },
  {
    id: 'ask-mentor',
    name: 'Ask Up',
    blurb: 'A senior has twenty minutes. Use them well.',
    hours: 8,
    tags: ['leadership', 'feedback'],
    effects: {
      competence: 3,
      network: 1,
      growth: 2,
      skill: 'communication',
      stage: 'scheme',
      revealFeedback: true,
    },
  },
  {
    id: 'work-across',
    name: 'Work Across',
    blurb: 'Trade interface tokens with another discipline.',
    hours: 16,
    tags: ['collaboration', 'coordination'],
    effects: {
      competence: 2,
      network: 3,
      reputation: 1,
      projectProgress: 8,
      skill: 'coordination',
      stage: 'detailed',
      milestone: 'ceilingCoord',
    },
  },
  {
    id: 'cpd-friday',
    name: 'CPD session',
    blurb: 'Diarised learning. Growth never switches off.',
    hours: 8,
    tags: ['growth', 'cpd'],
    effects: {
      competence: 3,
      growth: 2,
      wellbeing: 1,
      skill: 'technical',
      stage: 'concept',
      milestone: 'charterLog',
    },
  },
  {
    id: 'client-meeting',
    name: 'Client meeting',
    blurb: 'Show the options. Leave with a decision.',
    hours: 12,
    tags: ['collaboration', 'presenting'],
    effects: {
      reputation: 3,
      network: 2,
      fee: 2,
      skill: 'presenting',
      stage: 'scheme',
      milestone: 'clientSolo',
    },
  },
  {
    id: 'mentor-junior',
    name: 'Support Down',
    blurb: 'Help a junior. They gain Competence; you gain Reputation.',
    hours: 12,
    tags: ['leadership'],
    effects: {
      reputation: 3,
      growth: 1,
      wellbeing: 1,
      skill: 'communication',
      stage: 'detailed',
      milestone: 'mentorGrad',
    },
  },
  {
    id: 'automate',
    name: 'Automate a boring bit',
    blurb: 'Spend a block building a tool that pays back every month.',
    hours: 32,
    tags: ['technical', 'innovation'],
    effects: {
      competence: 5,
      reputation: 2,
      growth: 1,
      skill: 'technical',
      stage: 'detailed',
      milestone: 'automate',
    },
  },
  {
    id: 'model-layouts',
    name: 'Model layouts',
    blurb: 'Clean model, correct falls, coordinated void.',
    hours: 40,
    tags: ['technical', 'delivery', 'technician'],
    effects: {
      competence: 4,
      fee: 5,
      projectProgress: 14,
      skill: 'technical',
      stage: 'detailed',
      milestone: 'layoutSet',
    },
  },
  {
    id: 'clash-cycle',
    name: 'Run clash cycle',
    blurb: 'Find it in the model before it finds you on site.',
    hours: 20,
    tags: ['collaboration', 'technician'],
    effects: {
      competence: 3,
      reputation: 2,
      network: 2,
      projectProgress: 10,
      skill: 'coordination',
      stage: 'detailed',
      milestone: 'clashCycle',
    },
  },
  {
    id: 'learn-revit',
    name: 'Learn Revit',
    blurb: 'Unlock the second package. Painful. Worth it.',
    hours: 36,
    tags: ['technical', 'technician', 'software'],
    effects: {
      competence: 6,
      growth: 2,
      skill: 'technical',
      stage: 'detailed',
      milestone: 'secondPackage',
    },
  },
  {
    id: 'leave',
    name: 'Take leave',
    blurb: 'Wellbeing is a resource, not a reward for finishing.',
    hours: 40,
    tags: ['wellbeing'],
    effects: {
      wellbeing: 6,
      fee: -4,
    },
  },
  {
    id: 'overtime',
    name: 'Push overtime',
    blurb: 'Borrow hours from next month. Burnout is the famine.',
    hours: -40,
    tags: ['risk'],
    effects: {
      fee: 6,
      projectProgress: 10,
      wellbeing: -4,
      reputation: 1,
    },
  },
  {
    id: 'timesheets',
    name: 'Close timesheets',
    blurb: 'Accurate, on time. Quiet commercial hygiene.',
    hours: 4,
    tags: ['delivery', 'commercial'],
    effects: {
      fee: 2,
      reputation: 1,
      skill: 'commercial',
      stage: 'tender',
    },
  },
  {
    id: 'lunch-learn',
    name: 'Lunch & Learn',
    blurb: 'Host or attend. Teaching is learning twice.',
    hours: 6,
    tags: ['collaboration', 'network'],
    effects: {
      competence: 2,
      network: 3,
      reputation: 1,
      skill: 'communication',
      stage: 'concept',
    },
  },
]

export function actionsFor(track: Track, grade: GradeId): ActionDef[] {
  const tech = new Set([
    'model-layouts',
    'clash-cycle',
    'learn-revit',
    'drawing-set',
    'site-visit',
    'ask-mentor',
    'work-across',
    'cpd-friday',
    'leave',
    'overtime',
    'timesheets',
    'lunch-learn',
    'automate',
  ])
  const eng = new Set([
    'calc-package',
    'drawing-set',
    'design-review',
    'site-visit',
    'ask-mentor',
    'work-across',
    'cpd-friday',
    'client-meeting',
    'leave',
    'overtime',
    'timesheets',
    'lunch-learn',
    'automate',
  ])
  if (grade === 'engineer' || grade === 'senior' || grade === 'associate') {
    eng.add('mentor-junior')
    eng.add('client-meeting')
  }
  if (grade === 'seniorTechnician' || grade === 'bimLead' || grade === 'leadCoordinator') {
    tech.add('mentor-junior')
  }
  const pool = track === 'technician' ? tech : eng
  return ACTIONS.filter((a) => pool.has(a.id))
}

export const EVENTS: EventDef[] = [
  {
    id: 'architect-moves-riser',
    title: 'The Architect Moves the Riser',
    grade: ['graduate', 'technician'],
    body: 'A late GA revision shifts the riser by 600mm. Your package is half redrawn already.',
    choices: [
      {
        id: 'redraw',
        label: 'Redraw quietly',
        result: 'You absorb the hours. No one learns; the next move will be quieter still.',
        effects: { hours: -24, wellbeing: -2, fee: -2 },
      },
      {
        id: 'raise',
        label: 'Raise it at coordination',
        result: 'Awkward for ten minutes. Two disciplines adjust. You keep a week.',
        effects: { network: 3, reputation: 2, competence: 1 },
      },
      {
        id: 'ask-senior',
        label: 'Ask your senior',
        result: 'They back you in the room. You learn how escalation is supposed to feel.',
        effects: { growth: 2, network: 2, reputation: 1 },
      },
    ],
  },
  {
    id: 'revit-crashes',
    title: 'Revit Crashes at 4pm Before Issue',
    grade: ['graduate', 'technician', 'engineer'],
    body: 'Autosave lied. The issue set is due at 5. Three sheets are gone.',
    choices: [
      {
        id: 'stay-late',
        label: 'Stay late and rebuild',
        result: 'You make the issue. Wellbeing takes the loan.',
        effects: { wellbeing: -4, reputation: 2, fee: 2 },
      },
      {
        id: 'flag-gap',
        label: 'Issue with a known gap and flag it',
        result: 'Honest transmittal. The PM trusts you more than a heroic silence.',
        effects: { reputation: 3, network: 1, wellbeing: -1 },
      },
      {
        id: 'extension',
        label: 'Ask for a 24h extension',
        result: 'You get it. The lesson sticks: programme risk belongs on the table.',
        effects: { network: 2, growth: 1 },
      },
    ],
  },
  {
    id: 'rfi-flood',
    title: 'Contractor RFI Flood',
    grade: ['engineer', 'senior', 'seniorTechnician'],
    body: 'Eighteen RFIs land on a Friday. Half are vague. Two are safety-critical.',
    choices: [
      {
        id: 'answer-all',
        label: 'Answer all fast',
        result: 'Volume over triage. Two answers create new questions.',
        effects: { wellbeing: -3, reputation: 1, competence: 1 },
      },
      {
        id: 'triage',
        label: 'Triage with the PM',
        result: 'Safety first, clarity second, the rest queued. Prioritising is a technical skill.',
        effects: { network: 3, reputation: 3, growth: 1 },
      },
      {
        id: 'push-back',
        label: 'Push back on quality',
        result: 'You teach the contractor what a complete RFI looks like. Relationship dips, then improves.',
        effects: { reputation: 2, network: -1, competence: 2 },
      },
    ],
  },
  {
    id: 'recruiter-calls',
    title: 'The Recruiter Calls',
    grade: ['graduate', 'engineer', 'senior', 'technician', 'seniorTechnician'],
    body: 'A competitor offers 15% more and a shorter commute. Your current project is mid-scheme.',
    choices: [
      {
        id: 'stay',
        label: 'Stay and renegotiate',
        result: 'You stay. Mentorship deepens; Fee anxiety softens.',
        effects: { wellbeing: 2, growth: 2, reputation: 1 },
      },
      {
        id: 'negotiate',
        label: 'Negotiate where you are',
        result: 'A small raise and a clearer development plan. Network stays warm.',
        effects: { fee: 4, growth: 1, network: 1 },
      },
      {
        id: 'leave',
        label: 'Take the call seriously',
        result: 'You don’t leave yet — but you map a pivot. Options are a resource.',
        effects: { network: 3, growth: 1, wellbeing: 1 },
      },
    ],
  },
]

export function pickEvent(grade: GradeId, turn: number, used: string[]): EventDef | null {
  const pool = EVENTS.filter((e) => e.grade.includes(grade) && !used.includes(e.id))
  if (!pool.length) return null
  // deterministic-ish by turn
  return pool[turn % pool.length] ?? null
}
