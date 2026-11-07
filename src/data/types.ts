export type Track = 'engineer' | 'technician'
export type PathId = 'delivery' | 'technical' | 'collaboration' | 'leadership'
export type SkillId = 'technical' | 'communication' | 'presenting' | 'coordination' | 'commercial'
export type StageId =
  | 'concept'
  | 'scheme'
  | 'detailed'
  | 'tender'
  | 'construction'
  | 'commissioning'

export type GradeId =
  | 'graduate'
  | 'engineer'
  | 'senior'
  | 'associate'
  | 'technician'
  | 'seniorTechnician'
  | 'bimLead'
  | 'leadCoordinator'

export type DisciplineId =
  | 'electrical'
  | 'mechanical'
  | 'plumbing'
  | 'fire'
  | 'ict'
  | 'architect'
  | 'technician'

export type CardKind = 'habit' | 'specialism' | 'cross' | 'crisis'
export type YieldId =
  | 'production'
  | 'science'
  | 'gold'
  | 'influence'
  | 'culture'
  | 'happiness'
  | 'growth'

export type Rating = 'notShown' | 'emerging' | 'consistent' | 'roleModel'
export type ScreenId =
  | 'title'
  | 'character'
  | 'desk'
  | 'self'
  | 'cards'
  | 'review'
  | 'promotion'
  | 'event'
  | 'win'

export interface YieldEffect {
  yield: YieldId
  amount: number
  per?: string
}

export interface CardDef {
  id: string
  name: string
  kind: CardKind
  path: PathId | 'crisis'
  stage?: GradeId | 'any'
  discipline?: DisciplineId | 'all'
  effect: string
  practice: string
  yields: YieldEffect[]
  clearedBy?: string
  penalty?: Partial<Record<PathId | 'happiness' | 'culture' | 'gold' | 'science' | 'production' | 'influence' | 'growth', number>>
}

export interface CharacterDef {
  id: string
  name: string
  route: string
  discipline: DisciplineId
  track: Track
  backstory: string
  skills: Record<SkillId, number>
  strength: string
  blindSpot: string
  software?: ('autocad' | 'revit' | 'none')[]
}

export interface GradeDef {
  id: GradeId
  name: string
  stageName: string
  track: Track
  baseTimer: number | null
  slots: number
  theme: string
  milestones: { id: string; label: string; path: PathId }[]
  crisis: { id: string; name: string; blurb: string }
  impact: Partial<Record<StageId, 'learning' | 'low' | 'medium' | 'high'>>
  next: GradeId | null
}

export interface ProjectDef {
  id: string
  name: string
  type: string
  size: string
  grade: GradeId[]
  stage: StageId
  progress: number
  clashes: number
  allies: DisciplineId[]
}

export interface ActionDef {
  id: string
  name: string
  blurb: string
  hours: number
  tags: string[]
  effects: Partial<{
    competence: number
    reputation: number
    network: number
    fee: number
    wellbeing: number
    growth: number
    projectProgress: number
    revealFeedback: boolean
    milestone?: string
    skill?: SkillId
    stage?: StageId
  }>
}

export interface EventDef {
  id: string
  title: string
  grade: GradeId[]
  body: string
  choices: {
    id: string
    label: string
    result: string
    effects: Partial<{
      competence: number
      reputation: number
      network: number
      fee: number
      wellbeing: number
      hours: number
      growth: number
    }>
  }[]
}

export interface Resources {
  hours: number
  competence: number
  reputation: number
  network: number
  fee: number
  wellbeing: number
  growth: number
}

export interface PathScores {
  delivery: number
  technical: number
  collaboration: number
  leadership: number
}

export interface GridCell {
  skill: SkillId
  stage: StageId
  level: number
  selfRating: number
  revealed: boolean
}

export interface LogEntry {
  turn: number
  text: string
  tone?: 'neutral' | 'good' | 'warn' | 'bad'
}

export interface ReviewSnapshot {
  turn: number
  ratings: Record<string, Rating>
  pathDelta: PathScores
  pathTotals: PathScores
  growthGained: number
  crisesDrawn: string[]
  gatePass: boolean
  moralePenalty: boolean
  notes: string[]
}

export interface GameState {
  screen: ScreenId
  characterId: string
  discipline: DisciplineId
  track: Track
  grade: GradeId
  turn: number
  monthInGrade: number
  resources: Resources
  paths: PathScores
  growthBanked: number
  slotted: string[]
  masteredHabits: string[]
  unlockedSpecialisms: string[]
  crises: string[]
  neglect: PathScores
  consecutiveGate: number
  celebrationSlots: number
  celebrationExpires: number
  specialistWaive: PathId | null
  milestonesHit: string[]
  grid: GridCell[]
  projects: ProjectDef[]
  actionsThisMonth: string[]
  actionsThisReview: string[]
  pendingEvent: string | null
  reviewsDone: number
  lastReview: ReviewSnapshot | null
  log: LogEntry[]
  tipSeen: boolean
  software: { autocad: boolean; revit: boolean }
  ended: null | { win: boolean; path?: string; epilogue: string }
  burnoutTurns: number
  justPromoted: boolean
}
