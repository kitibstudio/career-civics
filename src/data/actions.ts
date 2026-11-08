import type { ActionDef, EventDef, GradeId, Track } from './types'

/** Every desk action is one 8h block — press again to stack more of the same work. */
export const ACTIONS: ActionDef[] = [
  {
    id: 'calc-package',
    name: 'Own a calc package',
    blurb: 'Run the numbers until the design stops arguing with itself. Stack blocks until the package is done.',
    hours: 8,
    tags: ['technical', 'delivery', 'detailed'],
    skills: ['technical'],
    effects: {
      competence: 2,
      fee: 1,
      projectProgress: 3,
      skill: 'technical',
    },
  },
  {
    id: 'drawing-set',
    name: 'Issue drawings',
    blurb: 'Sheets, schedules, revisions — make the package real. Stack blocks across the set.',
    hours: 8,
    tags: ['delivery', 'detailed', 'tender'],
    skills: ['technical', 'communication'],
    effects: {
      competence: 1,
      reputation: 1,
      fee: 1,
      projectProgress: 3,
      skill: 'technical',
    },
  },
  {
    id: 'design-review',
    name: 'Sit a design review',
    blurb: 'Present the package. Take the red pen seriously.',
    hours: 8,
    tags: ['delivery', 'presenting'],
    skills: ['presenting', 'technical'],
    effects: {
      competence: 1,
      reputation: 2,
      wellbeing: -1,
      projectProgress: 2,
      skill: 'presenting',
      revealFeedback: true,
    },
  },
  {
    id: 'site-visit',
    name: 'Site visit',
    blurb: 'Boots on. Drawings are not the building.',
    hours: 8,
    tags: ['collaboration', 'construction', 'site'],
    skills: ['technical', 'coordination'],
    effects: {
      competence: 1,
      network: 1,
      wellbeing: 1,
      projectProgress: 1,
      skill: 'coordination',
    },
  },
  {
    id: 'ask-mentor',
    name: 'Ask Up',
    blurb: 'A senior has twenty minutes. Use them well — especially when Overtime is piling up.',
    hours: 8,
    tags: ['leadership', 'feedback', 'support'],
    effects: {
      competence: 2,
      network: 1,
      growth: 1,
      skill: 'communication',
      revealFeedback: true,
    },
  },
  {
    id: 'work-across',
    name: 'Work Across',
    blurb: 'Trade interface tokens with another discipline.',
    hours: 8,
    tags: ['collaboration', 'coordination'],
    skills: ['coordination'],
    effects: {
      competence: 1,
      network: 2,
      reputation: 1,
      projectProgress: 2,
      skill: 'coordination',
    },
  },
  {
    id: 'cpd-friday',
    name: 'CPD session',
    blurb: 'Diarised learning. Growth never switches off.',
    hours: 8,
    tags: ['growth', 'cpd'],
    skills: ['technical'],
    effects: {
      competence: 1,
      growth: 1,
      wellbeing: 1,
      skill: 'technical',
    },
  },
  {
    id: 'client-meeting',
    name: 'Client meeting',
    blurb: 'Show the options. Leave with a decision.',
    hours: 8,
    tags: ['collaboration', 'presenting'],
    skills: ['presenting', 'communication'],
    effects: {
      reputation: 2,
      network: 1,
      fee: 1,
      skill: 'presenting',
    },
  },
  {
    id: 'mentor-junior',
    name: 'Support Down',
    blurb: 'Help a junior. They gain Competence; you gain Reputation.',
    hours: 8,
    tags: ['leadership'],
    skills: ['communication'],
    effects: {
      reputation: 2,
      growth: 1,
      wellbeing: 1,
      skill: 'communication',
    },
  },
  {
    id: 'automate',
    name: 'Automate a boring bit',
    blurb: 'Spend a block building a tool that pays back every month. Stack blocks for bigger tools.',
    hours: 8,
    tags: ['technical', 'innovation'],
    skills: ['technical'],
    effects: {
      competence: 2,
      reputation: 1,
      growth: 1,
      skill: 'technical',
    },
  },
  {
    id: 'model-layouts',
    name: 'Model layouts',
    blurb: 'Clean model, correct falls, coordinated void.',
    hours: 8,
    tags: ['technical', 'delivery', 'technician'],
    skills: ['technical'],
    effects: {
      competence: 1,
      fee: 1,
      projectProgress: 3,
      skill: 'technical',
    },
  },
  {
    id: 'clash-cycle',
    name: 'Run clash cycle',
    blurb: 'Find it in the model before it finds you on site.',
    hours: 8,
    tags: ['collaboration', 'technician'],
    skills: ['coordination'],
    effects: {
      competence: 1,
      reputation: 1,
      network: 1,
      projectProgress: 2,
      skill: 'coordination',
    },
  },
  {
    id: 'learn-revit',
    name: 'Learn Revit',
    blurb: 'Unlock the second package. Painful. Worth it. Stack blocks until it sticks.',
    hours: 8,
    tags: ['technical', 'technician', 'software'],
    skills: ['technical'],
    effects: {
      competence: 2,
      growth: 1,
      skill: 'technical',
    },
  },
  {
    id: 'chartership-log',
    name: 'Chartership log',
    blurb: 'Record learning against your chartership / CPD log. Stack blocks to build the record.',
    hours: 8,
    tags: ['leadership', 'cpd', 'charter'],
    skills: ['technical'],
    effects: {
      competence: 1,
      growth: 1,
      skill: 'technical',
    },
  },
  {
    id: 'ask-feedback',
    name: 'Ask for feedback',
    blurb: 'A dedicated 1:1. Reveals one fogged soft-skill cell. Seeking feedback is a habit.',
    hours: 8,
    tags: ['leadership', 'feedback'],
    effects: {
      growth: 1,
      revealFeedback: true,
    },
  },
  {
    id: 'unutilized',
    name: 'Unutilized time',
    blurb:
      'Eight idle hours with no work. Select once per leftover block (24h idle = three times). Yields: −8 Hours, −1 Fee (nothing billable), −1 Wellbeing (drift); Competence, Reputation, Network, and Growth stay flat — idle time earns none.',
    hours: 8,
    tags: ['idle'],
    effects: {
      fee: -1,
      wellbeing: -1,
    },
  },
  {
    id: 'leave',
    name: 'Take leave',
    blurb: 'Wellbeing is a resource, not a reward for finishing. Stack blocks for a proper break.',
    hours: 8,
    tags: ['wellbeing'],
    effects: {
      wellbeing: 2,
      fee: -1,
    },
  },
  {
    id: 'overtime',
    name: 'Overtime',
    blurb:
      'You are overloaded — log an after-hours block. This is a signal to seek support (Ask Up), not a badge of honour.',
    hours: 8,
    tags: ['risk', 'overload', 'support'],
    effects: {
      fee: 1,
      projectProgress: 2,
      wellbeing: -2,
      reputation: 1,
    },
  },
  {
    id: 'timesheets',
    name: 'Close timesheets',
    blurb: 'Accurate, on time. Quiet commercial hygiene.',
    hours: 8,
    tags: ['delivery', 'commercial'],
    skills: ['commercial'],
    effects: {
      fee: 1,
      reputation: 1,
      skill: 'commercial',
    },
  },
  {
    id: 'lunch-learn',
    name: 'Lunch & Learn',
    blurb: 'Host or attend. Teaching is learning twice.',
    hours: 8,
    tags: ['collaboration', 'network'],
    skills: ['communication', 'presenting'],
    effects: {
      competence: 1,
      network: 2,
      reputation: 1,
      skill: 'communication',
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
    'chartership-log',
    'ask-feedback',
    'unutilized',
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
    'chartership-log',
    'ask-feedback',
    'client-meeting',
    'unutilized',
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
