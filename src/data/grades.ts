import type { GradeDef, PathId } from './types'

export const PATH_LABELS: Record<PathId, string> = {
  delivery: 'Delivery',
  technical: 'Technical',
  collaboration: 'Collaboration',
  leadership: 'Leadership',
  commitment: 'Commitment',
}

export const PATH_ORDER: PathId[] = [
  'delivery',
  'technical',
  'collaboration',
  'leadership',
  'commitment',
]

export const STAGE_ORDER = [
  'concept',
  'scheme',
  'detailed',
  'tender',
  'construction',
  'commissioning',
] as const

export const STAGE_LABELS: Record<(typeof STAGE_ORDER)[number], string> = {
  concept: 'Concept',
  scheme: 'Scheme',
  detailed: 'Detailed Design',
  tender: 'Tender',
  construction: 'Construction',
  commissioning: 'Commissioning',
}

export const SKILL_LABELS = {
  technical: 'Technical',
  communication: 'Communication',
  presenting: 'Presenting',
  coordination: 'Coordination',
  commercial: 'Commercial',
} as const

export const GRADES: Record<string, GradeDef> = {
  graduate: {
    id: 'graduate',
    name: 'Graduate',
    stageName: 'Learning',
    track: 'engineer',
    baseTimer: 30,
    slots: 2,
    theme: 'Learn the codes, the tools and who to ask',
    milestones: [
      { id: 'calcPackage', label: 'Own a calc package', path: 'technical' },
      { id: 'designReview', label: 'Pass a design review', path: 'delivery' },
      { id: 'siteVisits', label: 'Log 20 site visits', path: 'collaboration' },
      { id: 'drawingSet', label: 'Complete a full drawing set', path: 'delivery' },
      { id: 'charterLog', label: 'Build chartership log (12 blocks)', path: 'commitment' },
    ],
    crisis: {
      id: 'designFreeze',
      name: 'Design Freeze',
      blurb: 'Late clashes flood in. Choose what to fix and what to escalate.',
    },
    impact: {
      concept: 'learning',
      scheme: 'learning',
      detailed: 'high',
      tender: 'high',
      construction: 'medium',
      commissioning: 'medium',
    },
    next: 'engineer',
  },
  engineer: {
    id: 'engineer',
    name: 'Engineer',
    stageName: 'Consolidating',
    track: 'engineer',
    baseTimer: 42,
    slots: 3,
    theme: 'Own a system end to end on one project',
    milestones: [
      { id: 'leadSmall', label: 'Lead a discipline on a small project', path: 'leadership' },
      { id: 'clientSolo', label: 'Client meeting solo', path: 'collaboration' },
      { id: 'specSection', label: 'Sign off a spec section', path: 'technical' },
      { id: 'mentorGrad', label: 'Mentor a graduate', path: 'leadership' },
      { id: 'chartership', label: 'Pass Professional Review', path: 'commitment' },
    ],
    crisis: {
      id: 'valueEngineering',
      name: 'Value Engineering',
      blurb: 'Client cuts the MEP budget 15%. Defend or adapt your design.',
    },
    impact: {
      concept: 'low',
      scheme: 'medium',
      detailed: 'high',
      tender: 'high',
      construction: 'medium',
      commissioning: 'medium',
    },
    next: 'senior',
  },
  senior: {
    id: 'senior',
    name: 'Senior Engineer',
    stageName: 'Mastery',
    track: 'engineer',
    baseTimer: 48,
    slots: 4,
    theme: 'Run the discipline across several projects',
    milestones: [
      { id: 'majorLead', label: 'Discipline lead on a major project', path: 'leadership' },
      { id: 'winBid', label: 'Win a bid', path: 'delivery' },
      { id: 'manageTeam', label: 'Manage a team of 3', path: 'leadership' },
      { id: 'commission', label: 'Deliver a commissioning', path: 'technical' },
      { id: 'claim', label: 'Resolve a contractor claim', path: 'delivery' },
    ],
    crisis: {
      id: 'commissioningCliff',
      name: 'Commissioning Cliff',
      blurb: 'Handover defects, snag lists and a client deadline collide.',
    },
    impact: {
      concept: 'medium',
      scheme: 'high',
      detailed: 'high',
      tender: 'medium',
      construction: 'medium',
      commissioning: 'high',
    },
    next: 'associate',
  },
  associate: {
    id: 'associate',
    name: 'Associate',
    stageName: 'Generalist',
    track: 'engineer',
    baseTimer: null,
    slots: 5,
    theme: 'Shape projects, people and the practice',
    milestones: [
      { id: 'legacy', label: 'Complete one Legacy Path', path: 'leadership' },
    ],
    crisis: {
      id: 'feeSqueeze',
      name: 'Fee Squeeze',
      blurb: 'Bid season, tight fees, a key person resigns.',
    },
    impact: {
      concept: 'high',
      scheme: 'high',
      detailed: 'medium',
      tender: 'low',
      construction: 'low',
      commissioning: 'medium',
    },
    next: null,
  },
  technician: {
    id: 'technician',
    name: 'Technician',
    stageName: 'Technician',
    track: 'technician',
    baseTimer: 36,
    slots: 2,
    theme: 'Produce clean layouts; learn the software and standards',
    milestones: [
      { id: 'layoutSet', label: 'Produce a full layout set', path: 'delivery' },
      { id: 'drawingQa', label: 'Pass a drawing QA check', path: 'technical' },
      { id: 'secondPackage', label: 'Learn your second package', path: 'technical' },
      { id: 'ceilingCoord', label: 'Coordinate one ceiling void', path: 'collaboration' },
      { id: 'family', label: 'Build a reusable family or template', path: 'technical' },
    ],
    crisis: {
      id: 'issueDay',
      name: 'Issue Day',
      blurb: '40 sheets due and markups arrive late.',
    },
    impact: {
      concept: 'learning',
      scheme: 'low',
      detailed: 'high',
      tender: 'high',
      construction: 'medium',
      commissioning: 'low',
    },
    next: 'seniorTechnician',
  },
  seniorTechnician: {
    id: 'seniorTechnician',
    name: 'Senior Technician',
    stageName: 'Senior Technician',
    track: 'technician',
    baseTimer: 42,
    slots: 3,
    theme: 'Own a discipline model; train juniors',
    milestones: [
      { id: 'leadModel', label: 'Lead a discipline model', path: 'technical' },
      { id: 'trainTech', label: 'Train a technician', path: 'leadership' },
      { id: 'clashFree', label: 'Deliver a clash-free floor', path: 'collaboration' },
      { id: 'automate', label: 'Automate one repetitive task', path: 'technical' },
      { id: 'tenderSet', label: 'Issue a tender set on time', path: 'delivery' },
    ],
    crisis: {
      id: 'modelMeltdown',
      name: 'Model Meltdown',
      blurb: 'A corrupted central model and version chaos.',
    },
    impact: {
      concept: 'learning',
      scheme: 'medium',
      detailed: 'high',
      tender: 'high',
      construction: 'medium',
      commissioning: 'medium',
    },
    next: 'bimLead',
  },
  bimLead: {
    id: 'bimLead',
    name: 'Project BIM Lead',
    stageName: 'BIM Lead',
    track: 'technician',
    baseTimer: 48,
    slots: 4,
    theme: 'Cross-discipline model standards, clash detection, QA/QC',
    milestones: [
      { id: 'bep', label: 'Write the BIM execution plan', path: 'delivery' },
      { id: 'clashCycle', label: 'Run a clash-detection cycle across MEP', path: 'collaboration' },
      { id: 'qaqc', label: 'Set QA/QC checks for every discipline', path: 'technical' },
      { id: 'air', label: "Deliver to the client's information requirements", path: 'delivery' },
      { id: 'newTool', label: 'Introduce a new tool', path: 'leadership' },
    ],
    crisis: {
      id: 'digitalHandover',
      name: 'Digital Handover Demand',
      blurb: 'The client adds asset-data requirements mid-project.',
    },
    impact: {
      concept: 'medium',
      scheme: 'high',
      detailed: 'high',
      tender: 'medium',
      construction: 'medium',
      commissioning: 'high',
    },
    next: 'leadCoordinator',
  },
  leadCoordinator: {
    id: 'leadCoordinator',
    name: 'Lead Coordinator',
    stageName: 'Lead Coordinator',
    track: 'technician',
    baseTimer: null,
    slots: 5,
    theme: 'Cross-discipline coordination and delivery across projects',
    milestones: [
      { id: 'legacyTech', label: 'Complete one Legacy Path', path: 'leadership' },
    ],
    crisis: {
      id: 'programmeCrunch',
      name: 'Programme Crunch',
      blurb: 'Three projects issue in one month.',
    },
    impact: {
      concept: 'medium',
      scheme: 'high',
      detailed: 'high',
      tender: 'high',
      construction: 'high',
      commissioning: 'medium',
    },
    next: null,
  },
}

export const MILESTONES_FOR_GATE = {
  // Growth: steady CPD (~+3/cycle) needs 3–4 reviews for Graduate
  graduate: { base: 1, m1: 1, m2: 3, golden: 5, gateStrong: 1, growthNeed: 20 },
  technician: { base: 1, m1: 1, m2: 3, golden: 5, gateStrong: 1, growthNeed: 20 },
  engineer: { base: 1, m1: 2, m2: 4, golden: 7, gateStrong: 1, growthNeed: 28 },
  seniorTechnician: { base: 1, m1: 2, m2: 4, golden: 7, gateStrong: 1, growthNeed: 28 },
  senior: { base: 2, m1: 2, m2: 5, golden: 9, gateStrong: 2, growthNeed: 36 },
  bimLead: { base: 2, m1: 2, m2: 5, golden: 9, gateStrong: 2, growthNeed: 36 },
  associate: { base: 2, m1: 3, m2: 6, golden: 10, gateStrong: 2, growthNeed: 48 },
  leadCoordinator: { base: 2, m1: 3, m2: 6, golden: 10, gateStrong: 2, growthNeed: 48 },
} as const

export function gateConfig(grade: string) {
  return MILESTONES_FOR_GATE[grade as keyof typeof MILESTONES_FOR_GATE] ?? MILESTONES_FOR_GATE.graduate
}
