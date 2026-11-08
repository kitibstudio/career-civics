export type Track = 'engineer' | 'technician'
export type PathId =
  | 'delivery'
  | 'technical'
  | 'collaboration'
  | 'leadership'
  | 'commitment'
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
  | 'charterReview'
  | 'win'

export type CharterBody = 'cibse' | 'engineersIreland'
export type UkSpecElementId =
  | 'A1'
  | 'A2'
  | 'B1'
  | 'B2'
  | 'B3'
  | 'C1'
  | 'C2'
  | 'C3'
  | 'C4'
  | 'D1'
  | 'D2'
  | 'D3'
  | 'E1'
  | 'E2'
  | 'E3'
  | 'E4'
  | 'E5'
export type EvidenceStrength = 'none' | 'mentioned' | 'demonstrated' | 'strong'
/** How the player describes their part when logging an episode ("I, not we"). */
export type ClaimRole = 'led' | 'contributed' | 'we'

export interface UkSpecElement {
  id: UkSpecElementId
  code: string
  theme: 'A' | 'B' | 'C' | 'D' | 'E'
  title: string
  short: string
}

export interface CharterEvidenceEntry {
  id: string
  turn: number
  source: 'action' | 'event' | 'cpd' | 'review'
  title: string
  elements: UkSpecElementId[]
  claim: ClaimRole
  /** Assessor credits only led/contributed that match real play; we = mentioned only. */
  credited: boolean
  note?: string
}

export interface SponsorState {
  id: string
  name: string
  /** 0–3; stronger ties speed Professional Review prep. */
  tieStrength: number
}

export interface DevelopmentActionPlan {
  short: string
  medium: string
  long: string
  lastReviewedTurn: number
}

export interface CpdState {
  /** Hours toward the 40h annual target (Engineers Ireland minimum). */
  plannedHours: number
  unplannedHours: number
  yearStartTurn: number
}

export interface ProfessionalReviewState {
  attempted: boolean
  passed: boolean
  deferredElements: UkSpecElementId[]
  notes: string[]
}

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
  /** Skills this action builds evidence for (at the live project stage). */
  skills?: SkillId[]
  /** UK-SPEC elements this action can log (player claims role on Self / auto-contributed). */
  elements?: UkSpecElementId[]
  /** Planned CPD hours when this action is taken (usually 8). */
  cpdHours?: number
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
  /** UK-SPEC elements this event can evidence. */
  elements?: UkSpecElementId[]
  choices: {
    id: string
    label: string
    result: string
    /** Suggested claim strength if the player picks this choice. */
    defaultClaim?: ClaimRole
    /** If true, this choice draws Corner Cut / ethics failure. */
    drawsCornerCut?: boolean
    effects: Partial<{
      competence: number
      reputation: number
      network: number
      fee: number
      wellbeing: number
      hours: number
      growth: number
      commitmentPath?: number
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
  commitment: number
}

export interface GridCell {
  skill: SkillId
  stage: StageId
  level: number
  selfRating: number
  revealed: boolean
  /** Evidence points toward the next level. */
  evidence: number
  /** Feedback has confirmed level ≥ 3. */
  confirmed: boolean
}

export interface FeedbackLogEntry {
  turn: number
  source: string
  text: string
  skill?: SkillId
  stage?: StageId
  thought?: number
  actual?: number
}

export interface InboxItem {
  defId: string
  monthsLeft: number
  resolved?: boolean
}

export interface TieState {
  id: string
  name: string
  role: string
  strength: number
}

export interface LogEntry {
  turn: number
  text: string
  tone?: 'neutral' | 'good' | 'warn' | 'bad'
}

export type PathLineKind =
  | 'base'
  | 'card'
  | 'lineage'
  | 'commitment'
  | 'milestone'
  | 'idle'
  | 'crisis'
  | 'neglect'
  | 'morale'
  | 'hint'

/** One itemised contribution to a path's Review delta (hint lines carry amount 0). */
export interface PathLine {
  label: string
  amount: number
  kind: PathLineKind
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
  /** Absent on saves made before itemised breakdowns existed. */
  pathLines?: Record<PathId, PathLine[]>
  slotsUsed?: number
  slotsMax?: number
}

export interface CareerHistoryEntry {
  kind: 'review' | 'promotion'
  turn: number
  grade: GradeId
  monthInGrade: number
  pathTotals?: PathScores
  pathDelta?: PathScores
  gatePass?: boolean
  streak?: number
  growthBanked?: number
  toGrade?: GradeId
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
  /** Yield snapshot at the start of the current month — strip shows plan deltas vs this. */
  monthStartResources: Resources
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
  /** Progress counters toward milestone targets. */
  milestoneProgress: Record<string, number>
  grid: GridCell[]
  projects: ProjectDef[]
  actionsThisMonth: string[]
  actionsThisReview: string[]
  /** Month numbers (1–6 within cycle) when each action id was taken — for rating spread. */
  actionMonthsThisReview: Record<string, number[]>
  pendingEvent: string | null
  inbox: InboxItem[]
  inboxUsed: string[]
  ties: TieState[]
  feedbackLog: FeedbackLogEntry[]
  positiveFeedbackThisReview: boolean
  reviewsDone: number
  lastReview: ReviewSnapshot | null
  /** Reviews and promotions across the whole career, oldest first. */
  careerHistory: CareerHistoryEntry[]
  log: LogEntry[]
  tipSeen: boolean
  software: { autocad: boolean; revit: boolean }
  ended: null | { win: boolean; path?: string; epilogue: string }
  burnoutTurns: number
  justPromoted: boolean
  /** Visible wellbeing floor; at or below triggers Burnout. */
  wellbeingFloor: number
  /** Chartership body chosen at career start. */
  charterBody: CharterBody
  sponsor: SponsorState
  actionPlan: DevelopmentActionPlan
  /** Best evidence strength per UK-SPEC element. */
  elementStrength: Record<UkSpecElementId, EvidenceStrength>
  charterLog: CharterEvidenceEntry[]
  cpd: CpdState
  professionalReview: ProfessionalReviewState
  /** Pending claim step after an event choice (I / contributed / we). */
  pendingClaim: null | { eventId: string; choiceId: string }
  /** Commitment path points from events — applied at Review, not mid-month. */
  pendingCommitment: number
}
