import type { DisciplineId, GradeId, StageId } from './types'

export interface InboxChoice {
  id: string
  label: string
  result: string
  hours?: number
  effects?: Partial<{
    competence: number
    reputation: number
    network: number
    fee: number
    wellbeing: number
    growth: number
    projectProgress: number
    tieDelta: number
  }>
  risk?: string
}

export interface InboxDef {
  id: string
  from: DisciplineId | string
  title: string
  body: string
  neededBy: StageId
  ifLate: string
  grades: GradeId[]
  choices: InboxChoice[]
}

export const INBOX_POOL: InboxDef[] = [
  {
    id: 'mech-chiller',
    from: 'mechanical',
    title: 'Interface · Chiller motor ratings',
    body: 'Mechanical needs motor ratings for your DB schedule before the set freezes.',
    neededBy: 'detailed',
    ifLate: 'Your schedule is rework; −Reputation with Mechanical.',
    grades: ['graduate', 'engineer', 'technician', 'seniorTechnician'],
    choices: [
      {
        id: 'walk',
        label: 'Walk over and ask (−2h, +tie)',
        result: 'You get the ratings clean. Mechanical trusts the next ask.',
        hours: 2,
        effects: { network: 1, tieDelta: 1, competence: 1 },
      },
      {
        id: 'assume',
        label: 'Assume typical ratings (0h, rework risk)',
        result: 'You keep moving. A wrong frame size will bite at tender.',
        hours: 0,
        risk: 'rework',
        effects: { fee: 1 },
      },
      {
        id: 'escalate',
        label: 'Ask Up to escalate (−Network)',
        result: 'Senior clears it. You spend social capital, not hours.',
        hours: 0,
        effects: { network: -2, growth: 1 },
      },
    ],
  },
  {
    id: 'ict-bms',
    from: 'ict',
    title: 'Interface · BMS points list',
    body: 'ICT wants panel locations and BMS points before containment is locked.',
    neededBy: 'detailed',
    ifLate: 'Containment clash appears on site.',
    grades: ['graduate', 'engineer', 'senior', 'bimLead'],
    choices: [
      {
        id: 'coordinate',
        label: 'Sit a short coordination (−4h, +tie)',
        result: 'Points list agreed. Clash risk drops.',
        hours: 4,
        effects: { network: 2, tieDelta: 1, projectProgress: 2 },
      },
      {
        id: 'defer',
        label: 'Promise next week (0h)',
        result: 'They wait. Deadline pressure rises.',
        hours: 0,
        risk: 'late',
      },
      {
        id: 'partial',
        label: 'Issue a draft schedule (−2h)',
        result: 'Good enough to start; expect one revision.',
        hours: 2,
        effects: { reputation: 1, projectProgress: 1 },
      },
    ],
  },
  {
    id: 'fire-cande',
    from: 'fire',
    title: 'Interface · Fire alarm layout',
    body: 'Fire needs device layout for the cause-and-effect matrix.',
    neededBy: 'detailed',
    ifLate: 'Life-safety test fails at Commissioning.',
    grades: ['graduate', 'engineer', 'senior'],
    choices: [
      {
        id: 'mark',
        label: 'Mark devices on GA (−4h)',
        result: 'Fire can finish the matrix. You look reliable.',
        hours: 4,
        effects: { competence: 1, reputation: 2, tieDelta: 1 },
      },
      {
        id: 'generic',
        label: 'Send a typical layout (0h, risk)',
        result: 'Fast. Wrong spacing shows up in the witness test.',
        hours: 0,
        risk: 'rework',
        effects: { fee: 1 },
      },
      {
        id: 'askup',
        label: 'Ask Up for a peer check (−2h)',
        result: 'Senior spots two missing call points before issue.',
        hours: 2,
        effects: { growth: 1, network: 1 },
      },
    ],
  },
  {
    id: 'arch-riser',
    from: 'architect',
    title: 'Interface · Riser size',
    body: 'Architect asks for your riser service sizes at Scheme.',
    neededBy: 'scheme',
    ifLate: 'Late space grab; riser shrinks.',
    grades: ['graduate', 'engineer', 'technician'],
    choices: [
      {
        id: 'sizes',
        label: 'Issue working sizes (−2h, +tie)',
        result: 'Space held. Architect books you for the next coordination.',
        hours: 2,
        effects: { network: 2, tieDelta: 1, reputation: 1 },
      },
      {
        id: 'hold',
        label: 'Hold until calcs firm (0h)',
        result: 'Accurate later; space fights now.',
        hours: 0,
        risk: 'late',
      },
      {
        id: 'oversize',
        label: 'Oversize to be safe (−1h)',
        result: 'Space is generous. Commercial will ask why.',
        hours: 1,
        effects: { fee: -1, projectProgress: 1 },
      },
    ],
  },
  {
    id: 'struct-penos',
    from: 'structural',
    title: 'Interface · Penetration schedule',
    body: 'Structural needs penetrations before the slab pour.',
    neededBy: 'scheme',
    ifLate: 'Core drilling event; cost and delay.',
    grades: ['graduate', 'engineer', 'senior', 'seniorTechnician', 'bimLead'],
    choices: [
      {
        id: 'schedule',
        label: 'Issue the schedule (−6h)',
        result: 'Pour goes ahead. Structural owes you a favour.',
        hours: 6,
        effects: { competence: 2, reputation: 2, tieDelta: 1, projectProgress: 3 },
      },
      {
        id: 'sketch',
        label: 'Send a redline sketch (−2h)',
        result: 'Enough for pour day one; expect RFIs.',
        hours: 2,
        effects: { reputation: 1 },
      },
      {
        id: 'delay',
        label: 'Ask to move the pour (0h, −Network)',
        result: 'Programme slips. You keep accuracy.',
        hours: 0,
        effects: { network: -2, wellbeing: -1 },
      },
    ],
  },
  {
    id: 'crunch-issue',
    from: 'pm',
    title: 'Crunch · Issue deadline tomorrow',
    body: 'The issue set slipped. Overtime would save the date. Wellbeing is watching.',
    neededBy: 'detailed',
    ifLate: 'Reputation hit with the client PM.',
    grades: ['graduate', 'engineer', 'technician', 'senior', 'seniorTechnician', 'bimLead'],
    choices: [
      {
        id: 'overtime',
        label: 'Push overtime tonight (−Wellbeing, +Fee)',
        result: 'You make the issue. Exhaustion banks for later.',
        hours: 0,
        effects: { wellbeing: -3, fee: 3, reputation: 2, projectProgress: 4 },
      },
      {
        id: 'askup-crunch',
        label: 'Ask Up — reduce the overtime (−2h)',
        result: 'Senior re-scopes the set. You work late, not all night.',
        hours: 2,
        effects: { wellbeing: -1, growth: 2, network: 1, reputation: 1, projectProgress: 2 },
      },
      {
        id: 'slip',
        label: 'Flag the slip early (0h)',
        result: 'Honest. Client unhappy; no Burnout loan.',
        hours: 0,
        effects: { reputation: -2, wellbeing: 1 },
      },
    ],
  },
]

export function inboxForGrade(grade: GradeId, turn: number, used: string[]): InboxDef[] {
  const pool = INBOX_POOL.filter((i) => i.grades.includes(grade) && !used.includes(i.id))
  if (!pool.length) return []
  // 2–3 cards; always try to include one crunch every 6 months
  const crunch = pool.find((i) => i.id.startsWith('crunch'))
  const rest = pool.filter((i) => i !== crunch)
  const picks: InboxDef[] = []
  const n = 2 + (turn % 3 === 0 ? 1 : 0)
  for (let i = 0; i < n && rest.length; i++) {
    const idx = (turn * 3 + i * 5) % rest.length
    picks.push(rest.splice(idx, 1)[0])
  }
  if (crunch && (turn % 6 === 3 || picks.length < 2)) picks.unshift(crunch)
  return picks.slice(0, 3)
}
