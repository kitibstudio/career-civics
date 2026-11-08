import { ACTIONS, EVENTS, actionsFor, pickEvent } from '../data/actions'
import {
  CARD_BY_ID,
  habitsForGrade,
  specialismsFor,
  startingHabit,
  startingSpecialism,
} from '../data/cards'
import { CHARACTERS } from '../data/characters'
import { GRADES, PATH_LABELS, PATH_ORDER, STAGE_ORDER, gateConfig } from '../data/grades'
import { INBOX_POOL, inboxForGrade } from '../data/inbox'
import {
  defaultActionPlan,
  defaultSponsor,
  emptyEvidenceMap,
} from '../data/ukSpec'
import {
  addCpdHours,
  applyActionChartership,
  canAttemptProfessionalReview,
  commitmentPathDeltaFromActions,
  ensureChartership,
  logEvidence,
  runProfessionalReview,
} from './chartership'
import {
  applyMilestoneProgress,
  defaultTies,
  enforceRoleModelCap,
  gainGridEvidence,
  growthNeedFor,
  monthInCycle,
  rateCard,
  revealPriorityCell,
} from './progress'
import { canPromoteNormal } from './promotion'
import type {
  ActionDef,
  CardDef,
  CareerHistoryEntry,
  ClaimRole,
  GameState,
  GradeId,
  GridCell,
  PathId,
  PathLine,
  PathScores,
  Rating,
  Resources,
  ReviewSnapshot,
  SkillId,
  StageId,
} from '../data/types'

const PATHS: PathId[] = [...PATH_ORDER]
const STORAGE_KEY = 'career-civics-save-v3'

const RATING_MULT: Record<Rating, number> = {
  notShown: 0,
  emerging: 0.5,
  consistent: 1,
  roleModel: 1.5,
}

function emptyPaths(): PathScores {
  return { delivery: 0, technical: 0, collaboration: 0, leadership: 0, commitment: 0 }
}

export function commitmentRequired(grade: GradeId): boolean {
  return ['engineer', 'senior', 'associate', 'seniorTechnician', 'bimLead', 'leadCoordinator'].includes(
    grade,
  )
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function pushLog(state: GameState, text: string, tone: GameState['log'][0]['tone'] = 'neutral') {
  state.log = [{ turn: state.turn, text, tone }, ...state.log].slice(0, 40)
}

function pushHistory(state: GameState, entry: CareerHistoryEntry) {
  state.careerHistory = [...(state.careerHistory ?? []), entry].slice(-60)
}

function makeGrid(skills: Record<SkillId, number>): GridCell[] {
  const skillIds: SkillId[] = [
    'technical',
    'communication',
    'presenting',
    'coordination',
    'commercial',
  ]
  const cells: GridCell[] = []
  for (const skill of skillIds) {
    for (const stage of STAGE_ORDER) {
      const base = Math.min(2, skills[skill] ?? 0)
      const soft = skill !== 'technical'
      cells.push({
        skill,
        stage,
        level: soft ? 0 : Math.max(0, Math.min(1, base)),
        selfRating: Math.max(0, base + (soft ? 1 : 0)),
        revealed: !soft,
        evidence: soft ? 0 : base >= 1 ? 2 : 0,
        confirmed: false,
      })
    }
  }
  return cells
}

function demoProjects(grade: GradeId): GameState['projects'] {
  if (grade === 'technician' || grade === 'graduate') {
    return [
      {
        id: 'fitout-01',
        name: 'Harbour Loft Fit-out',
        type: 'Fit-out',
        size: 'Hamlet',
        grade: [grade],
        stage: 'detailed',
        progress: 18,
        clashes: 2,
        allies: ['architect', 'mechanical', 'electrical'],
      },
      {
        id: 'villa-01',
        name: 'Cedar Villa',
        type: 'Residential villa',
        size: 'Small city',
        grade: [grade],
        stage: 'scheme',
        progress: 8,
        clashes: 1,
        allies: ['architect', 'plumbing', 'electrical'],
      },
    ]
  }
  return [
    {
      id: 'tower-01',
      name: 'Northline Office Tower',
      type: 'Office tower',
      size: 'City',
      grade: [grade],
      stage: 'detailed',
      progress: 22,
      clashes: 3,
      allies: ['architect', 'mechanical', 'electrical', 'fire', 'ict'],
    },
  ]
}

export function createNewGame(
  characterId: string,
  opts?: { charterBody?: GameState['charterBody'] },
): GameState {
  const character = CHARACTERS.find((c) => c.id === characterId) ?? CHARACTERS[0]
  const grade: GradeId = character.track === 'technician' ? 'technician' : 'graduate'
  const spec = startingSpecialism(character.discipline)
  const habit = startingHabit(character.track)

  const state: GameState = {
    screen: 'desk',
    characterId: character.id,
    discipline: character.discipline,
    track: character.track,
    grade,
    turn: 1,
    monthInGrade: 1,
    resources: {
      hours: 160,
      competence: 4,
      reputation: 2,
      network: 2,
      fee: 10,
      wellbeing: 12,
      growth: 0,
    },
    monthStartResources: {
      hours: 160,
      competence: 4,
      reputation: 2,
      network: 2,
      fee: 10,
      wellbeing: 12,
      growth: 0,
    },
    paths: emptyPaths(),
    growthBanked: 0,
    slotted: [habit, ...(spec ? [spec] : [])].slice(0, GRADES[grade].slots),
    masteredHabits: [],
    unlockedSpecialisms: spec ? [spec] : [],
    crises: [],
    neglect: emptyPaths(),
    consecutiveGate: 0,
    celebrationSlots: 0,
    celebrationExpires: 0,
    specialistWaive: null,
    milestonesHit: [],
    milestoneProgress: {},
    grid: makeGrid(character.skills),
    projects: demoProjects(grade),
    actionsThisMonth: [],
    actionsThisReview: [],
    actionMonthsThisReview: {},
    pendingEvent: null,
    inbox: [],
    inboxUsed: [],
    ties: defaultTies(character.discipline),
    feedbackLog: [],
    positiveFeedbackThisReview: false,
    reviewsDone: 0,
    lastReview: null,
    careerHistory: [],
    log: [],
    tipSeen: false,
    software: {
      autocad: character.id === 'sam',
      revit: false,
    },
    ended: null,
    burnoutTurns: 0,
    justPromoted: false,
    wellbeingFloor: 4,
    charterBody: opts?.charterBody ?? 'cibse',
    sponsor: defaultSponsor(character.discipline),
    actionPlan: defaultActionPlan(grade),
    elementStrength: emptyEvidenceMap(),
    charterLog: [],
    cpd: { plannedHours: 0, unplannedHours: 0, yearStartTurn: 1 },
    professionalReview: {
      attempted: false,
      passed: false,
      deferredElements: [],
      notes: [],
    },
    pendingClaim: null,
    pendingCommitment: 0,
  }

  refreshInbox(state)
  pushLog(
    state,
    `Welcome, ${character.name}. Second Pair of Eyes is always on. Commitment path (E) is open — pick a sponsor (${state.sponsor.name}) and log evidence against UK-SPEC.`,
    'good',
  )
  return state
}

function refreshInbox(state: GameState) {
  const defs = inboxForGrade(state.grade, state.turn, state.inboxUsed)
  state.inbox = defs.map((d) => ({
    defId: d.id,
    monthsLeft: d.neededBy === 'scheme' ? 2 : 3,
    resolved: false,
  }))
}

export function slotCount(state: GameState): number {
  const base = GRADES[state.grade]?.slots ?? 2
  const celeb = state.celebrationSlots > 0 && state.turn <= state.celebrationExpires ? 1 : 0
  return base + celeb - state.crises.length
}

export function availableCards(state: GameState): CardDef[] {
  const habits = habitsForGrade(state.grade)
  const specs = specialismsFor(state.grade, state.discipline, state.unlockedSpecialisms)
  const crises = state.crises.map((id) => CARD_BY_ID[id]).filter(Boolean)
  return [...habits, ...specs, ...crises]
}

function applyResource(
  res: Resources,
  key: keyof Resources,
  delta: number,
  burnout: boolean,
) {
  const mult = burnout && key !== 'wellbeing' && key !== 'hours' ? 0.5 : 1
  res[key] = Math.round((res[key] + delta * mult) * 10) / 10
}

function revealFeedback(state: GameState) {
  const cell = revealPriorityCell(state)
  if (!cell) return
  state.positiveFeedbackThisReview = true
  const thought = cell.selfRating
  const entry = {
    turn: state.turn,
    source: '1:1 / Ask for feedback',
    text:
      cell.level < thought
        ? `You thought ${thought}; actual ${cell.level}. Seek practice before the next review.`
        : `Confirmed ${cell.skill} @ ${cell.stage} at level ${cell.level}.`,
    skill: cell.skill,
    stage: cell.stage,
    thought,
    actual: cell.level,
  }
  state.feedbackLog = [entry, ...state.feedbackLog].slice(0, 30)
  pushLog(
    state,
    `Feedback reveals ${cell.skill} @ ${cell.stage}: level ${cell.level} (you thought ${thought}).`,
    cell.level < thought ? 'warn' : 'good',
  )
}

function cardBonus(state: GameState, action: ActionDef): Partial<Resources> {
  const bonus: Partial<Resources> = {}
  const slotted = state.slotted.map((id) => CARD_BY_ID[id]).filter(Boolean)
  const tags = new Set(action.tags)

  for (const card of slotted) {
    if (card.kind === 'crisis') continue
    // light thematic bonuses when action tags align with card path
    if (card.path === 'technical' && (tags.has('technical') || tags.has('detailed'))) {
      bonus.competence = (bonus.competence ?? 0) + 1
    }
    if (card.path === 'delivery' && (tags.has('delivery') || tags.has('tender'))) {
      bonus.fee = (bonus.fee ?? 0) + 1
    }
    if (card.path === 'collaboration' && (tags.has('collaboration') || tags.has('coordination'))) {
      bonus.network = (bonus.network ?? 0) + 1
    }
    if (card.path === 'leadership' && (tags.has('leadership') || tags.has('feedback'))) {
      bonus.growth = (bonus.growth ?? 0) + 1
    }
    if (card.id === 'field-notes' && tags.has('site')) bonus.competence = (bonus.competence ?? 0) + 2
    if (card.id === 'seek-the-elders' && action.id === 'ask-mentor') {
      bonus.growth = (bonus.growth ?? 0) + 1
    }
    if (card.id === 'open-workshop' && action.id === 'work-across') {
      bonus.competence = (bonus.competence ?? 0) + 1
      bonus.network = (bonus.network ?? 0) + 1
    }
    if (card.id === 'tinkerers-bench' && tags.has('innovation')) {
      bonus.competence = (bonus.competence ?? 0) + 1
    }
    if (card.id === 'clean-model' && action.id === 'model-layouts') {
      bonus.fee = (bonus.fee ?? 0) + 2
    }
    if (card.id === 'ask-the-engineer' && action.id === 'ask-mentor') {
      bonus.competence = (bonus.competence ?? 0) + 1
    }
  }
  return bonus
}

export function canAfford(state: GameState, action: ActionDef): boolean {
  if (action.hours < 0) return true // legacy: negative hours add capacity
  return state.resources.hours >= action.hours
}

/** Civ-style yield preview for one selection of an action (includes slotted card bonuses). */
export function actionYieldPreview(
  state: GameState,
  action: ActionDef,
): {
  hoursDelta: number
  resources: Partial<Record<keyof Resources, number>>
  projectProgress: number
  pathLean: PathId[]
  reviewHint?: string
} {
  const burnout = state.burnoutTurns > 0
  const bonus = cardBonus(state, action)
  const resources: Partial<Record<keyof Resources, number>> = {}
  const keys: (keyof Resources)[] = [
    'competence',
    'reputation',
    'network',
    'fee',
    'wellbeing',
    'growth',
  ]
  for (const key of keys) {
    const base = (action.effects[key as keyof typeof action.effects] as number | undefined) ?? 0
    const extra = bonus[key] ?? 0
    let total = base + extra
    if (!total) continue
    if (burnout && key !== 'wellbeing' && key !== 'hours') total = Math.round(total * 0.5 * 10) / 10
    resources[key] = total
  }

  const pathLean: PathId[] = []
  const tags = new Set(action.tags)
  if (tags.has('delivery') || tags.has('tender') || tags.has('commercial')) pathLean.push('delivery')
  if (tags.has('technical') || tags.has('detailed') || tags.has('software')) pathLean.push('technical')
  if (tags.has('commitment') || tags.has('safety') || tags.has('ethics') || tags.has('sustainability') || tags.has('charter'))
    pathLean.push('commitment')
  if (tags.has('collaboration') || tags.has('coordination') || tags.has('network')) {
    pathLean.push('collaboration')
  }
  if (tags.has('leadership') || tags.has('feedback')) pathLean.push('leadership')

  let reviewHint: string | undefined
  if (action.id === 'unutilized') {
    const idle = state.actionsThisReview.filter((id) => id === 'unutilized').length
    reviewHint = `Costs −1 Delivery path per block at Review${
      idle ? ` (×${idle} this cycle already = −${idle} Delivery)` : ''
    }. Fee & Wellbeing fall now; nothing else is earned.`
  }

  return {
    hoursDelta: -action.hours,
    resources,
    projectProgress: action.effects.projectProgress ?? 0,
    pathLean,
    reviewHint,
  }
}

export function timesUsedThisMonth(state: GameState, actionId: string): number {
  return state.actionsThisMonth.filter((id) => id === actionId).length
}

/** Month-to-date yield deltas vs the start-of-month snapshot (always includes every yield, even +0). */
export function monthPlanYieldDeltas(state: GameState): Record<keyof Resources, number> {
  const start = state.monthStartResources ?? state.resources
  const keys: (keyof Resources)[] = [
    'hours',
    'competence',
    'reputation',
    'network',
    'fee',
    'wellbeing',
    'growth',
  ]
  const out = {} as Record<keyof Resources, number>
  for (const key of keys) {
    out[key] = Math.round((state.resources[key] - start[key]) * 10) / 10
  }
  return out
}

/** Evidence counts this review cycle — what feeds each promotion path. */
export function pathActionEvidence(state: GameState): Record<PathId, { label: string; count: number }[]> {
  const counts = state.actionsThisReview.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1
    return acc
  }, {})
  const n = (id: string) => counts[id] ?? 0
  return {
    delivery: [
      { label: 'Issue drawings', count: n('drawing-set') },
      { label: 'Design review', count: n('design-review') },
      { label: 'Timesheets', count: n('timesheets') },
      { label: 'Unutilized (−8h)', count: n('unutilized') },
    ].filter((x) => x.count > 0),
    technical: [
      { label: 'Calc package', count: n('calc-package') },
      { label: 'Model layouts', count: n('model-layouts') },
      { label: 'Automate', count: n('automate') },
      { label: 'CPD', count: n('cpd-friday') },
      { label: 'Learn Revit', count: n('learn-revit') },
    ].filter((x) => x.count > 0),
    collaboration: [
      { label: 'Work Across', count: n('work-across') },
      { label: 'Client meeting', count: n('client-meeting') },
      { label: 'Clash cycle', count: n('clash-cycle') },
      { label: 'Lunch & Learn', count: n('lunch-learn') },
      { label: 'Site visit', count: n('site-visit') },
    ].filter((x) => x.count > 0),
    leadership: [
      { label: 'Ask Up', count: n('ask-mentor') },
      { label: 'Support Down', count: n('mentor-junior') },
      { label: 'Peer drawing check', count: n('peer-check') },
      { label: 'CPD', count: n('cpd-friday') },
    ].filter((x) => x.count > 0),
    commitment: [
      { label: 'Risk review', count: n('risk-review') },
      { label: 'Carbon option', count: n('carbon-option') },
      { label: 'Ethics / conduct', count: n('conduct-dilemma') },
      { label: 'Requirements', count: n('requirements-brief') },
      { label: 'Evaluate built', count: n('evaluate-built') },
      { label: 'Chartership log', count: n('chartership-log') },
      { label: 'CPD', count: n('cpd-friday') },
    ].filter((x) => x.count > 0),
  }
}

export function performAction(state: GameState, actionId: string): GameState {
  const next = clone(state)
  const action = ACTIONS.find((a) => a.id === actionId)
  if (!action || next.screen !== 'desk' || next.ended) return state
  if (!canAfford(next, action)) {
    pushLog(next, 'Not enough hours this month.', 'warn')
    return next
  }

  const burnout = next.burnoutTurns > 0
  next.resources.hours -= action.hours
  const effects = action.effects
  const bonus = cardBonus(next, action)

  const deltas: (keyof Resources)[] = [
    'competence',
    'reputation',
    'network',
    'fee',
    'wellbeing',
    'growth',
  ]
  for (const key of deltas) {
    const base = (effects[key as keyof typeof effects] as number | undefined) ?? 0
    const extra = bonus[key] ?? 0
    if (base || extra) applyResource(next.resources, key, base + extra, burnout)
  }

  if (effects.projectProgress) {
    const project = next.projects[0]
    if (project) {
      project.progress = Math.min(100, project.progress + effects.projectProgress)
      if (project.progress >= 100) {
        pushLog(next, `${project.name} delivered. Reputation rises.`, 'good')
        applyResource(next.resources, 'reputation', 5, burnout)
        applyResource(next.resources, 'wellbeing', 2, burnout)
        project.progress = 15
        project.clashes = Math.max(0, project.clashes - 1)
      }
    }
  }

  applyMilestoneProgress(next, actionId)
  applyActionChartership(next, action)

  if (action.id === 'learn-revit') next.software.revit = true
  if (effects.revealFeedback) revealFeedback(next)
  const projectStage = next.projects[0]?.stage ?? 'detailed'
  gainGridEvidence(next, action, projectStage)

  // Soft-skill outcome flavour on design review / client meeting
  if (action.id === 'design-review' || action.id === 'client-meeting') {
    const presenting = next.grid.find((c) => c.skill === 'presenting' && c.stage === projectStage)
    const tech = next.grid.find((c) => c.skill === 'technical' && c.stage === projectStage)
    const p = presenting?.revealed ? presenting.level : presenting?.selfRating ?? 0
    const t = tech?.level ?? 0
    if (p >= 2 && t >= 2) {
      applyResource(next.resources, 'reputation', 1, burnout)
      pushLog(next, `Strong ${action.name}: Presenting ${p} + Technical ${t} at ${projectStage}.`, 'good')
    } else if (p < 1) {
      pushLog(
        next,
        `${action.name}: content was fine but the room lost the thread (Presenting low at ${projectStage}).`,
        'warn',
      )
    }
  }

  // Black Box risk if automate without QA habit — rarer; skip if any crisis already in play
  const hasQaHabit =
    next.slotted.includes('tinkerers-bench') ||
    next.slotted.includes('toolsmith') ||
    next.masteredHabits.includes('tinkerers-bench')
  if (
    action.id === 'automate' &&
    !hasQaHabit &&
    next.crises.length === 0 &&
    Math.random() < (next.track === 'technician' ? 0.08 : 0.12) &&
    !next.crises.includes('black-box')
  ) {
    drawCrisis(next, 'black-box')
  }

  next.actionsThisMonth.push(actionId)
  next.actionsThisReview.push(actionId)
  const mic = monthInCycle(next)
  const months = next.actionMonthsThisReview[actionId] ?? []
  if (!months.includes(mic)) next.actionMonthsThisReview[actionId] = [...months, mic]
  const uses = next.actionsThisMonth.filter((id) => id === actionId).length
  if (action.id === 'unutilized') {
    pushLog(
      next,
      `Unutilized ×${uses}: yields −8 Hours, −1 Fee, −1 Wellbeing; Competence/Reputation/Network/Growth unchanged. Delivery path −1 at Review.`,
      'warn',
    )
  } else {
    pushLog(next, `Did: ${action.name}${uses > 1 ? ` (×${uses} this month)` : ''}`, 'neutral')
  }

  if (next.resources.wellbeing <= next.wellbeingFloor && next.burnoutTurns <= 0) {
    next.burnoutTurns = 3
    pushLog(
      next,
      `Burnout (Wellbeing ≤ ${next.wellbeingFloor}). Yields halved for 3 months. Ask Up and leave are the relief valves.`,
      'bad',
    )
  }

  return next
}

export function endMonth(state: GameState): GameState {
  const next = clone(state)
  if (next.screen !== 'desk' || next.ended) return state

  // leftover hours are still idle — nudge the player; yields need explicit Unutilized blocks
  const leftover = next.resources.hours
  const idleBlocks = next.actionsThisMonth.filter((id) => id === 'unutilized').length
  if (leftover >= 8) {
    const suggested = Math.floor(leftover / 8)
    pushLog(
      next,
      `${leftover}h left unspent (${suggested} block${suggested === 1 ? '' : 's'}). Next month put them into actions that feed your weakest path — logging them as Unutilized costs −1 Delivery each at Review.`,
      'warn',
    )
  } else if (idleBlocks >= 3) {
    pushLog(
      next,
      `Heavy idle month (${idleBlocks} unutilized blocks). Fee/Wellbeing yields took the hit; Delivery path will too at Review.`,
      'warn',
    )
  }

  // passive founding charter CPD if diarised
  if (next.actionsThisMonth.includes('cpd-friday')) {
    applyResource(next.resources, 'growth', 1, next.burnoutTurns > 0)
  }

  // Tick inbox deadlines
  for (const item of next.inbox) {
    if (!item.resolved) item.monthsLeft -= 1
  }

  next.monthInGrade += 1
  next.turn += 1
  next.actionsThisMonth = []
  next.resources.hours = 160
  next.monthStartResources = clone(next.resources)
  if (next.burnoutTurns > 0) next.burnoutTurns -= 1

  // wellbeing drift
  if (next.resources.wellbeing > 16) next.resources.wellbeing = 16

  // Advance live project stage slowly with progress
  const project = next.projects[0]
  if (project) {
    const order: StageId[] = ['concept', 'scheme', 'detailed', 'tender', 'construction', 'commissioning']
    if (project.progress >= 70) {
      const idx = order.indexOf(project.stage)
      if (idx >= 0 && idx < order.length - 1 && project.progress >= 85) {
        project.stage = order[idx + 1]
        project.progress = 20
        pushLog(next, `${project.name} moves to ${project.stage}.`, 'good')
      }
    }
  }

  const grade = GRADES[next.grade]
  if (grade.baseTimer && next.monthInGrade > grade.baseTimer) {
    pushLog(next, 'Grade timer elapsed — Plateau season. You can still push for promotion.', 'warn')
  }

  // event every few months
  if (next.turn % 4 === 0 && !next.pendingEvent) {
    const used = next.log.filter((l) => l.text.startsWith('Event:')).map((l) => l.text)
    const ev = pickEvent(next.grade, next.turn, [])
    if (ev && !used.some((t) => t.includes(ev.title))) {
      next.pendingEvent = ev.id
      next.screen = 'event'
      return next
    }
  }

  // Review every 6 months
  if (next.monthInGrade > 1 && (next.monthInGrade - 1) % 6 === 0) {
    return beginReview(next)
  }

  refreshInbox(next)
  pushLog(next, `Month ${next.turn} begins. 160 hours on the desk.`, 'neutral')
  return next
}

function scoreCard(
  card: CardDef,
  rating: Rating,
  actionCounts: Record<string, number>,
  disciplineCount: number,
): { points: number; happiness: number; growth: number; path: PathId } {
  const mult = RATING_MULT[rating]
  let raw = 0
  let happiness = 0
  let growth = 0

  for (const y of card.yields) {
    if (y.yield === 'growth') {
      growth += y.amount * mult
      continue
    }
    if (y.yield === 'happiness') {
      let h = y.amount
      if (y.per === 'mentee') h *= Math.min(3, actionCounts['mentor-junior'] ?? 1)
      happiness += h * mult
      continue
    }
    let amt = y.amount
    if (y.per?.includes('meeting') || y.per?.includes('proposal') || y.per?.includes('client')) {
      const events =
        (actionCounts['client-meeting'] ?? 0) +
        (actionCounts['design-review'] ?? 0) +
        (actionCounts['lunch-learn'] ?? 0)
      amt *= Math.min(3, Math.max(1, events))
    }
    if (y.per === 'discipline' || y.per?.includes('discipline')) {
      amt *= Math.min(3, Math.max(1, disciplineCount))
    }
    if (y.per?.includes('10%')) amt = Math.min(2, amt)
    raw += amt
  }

  // minimum presence score so slotted cards always matter
  if (raw === 0 && card.kind !== 'crisis') raw = 1

  const path: PathId =
    card.kind === 'cross'
      ? 'collaboration'
      : card.kind === 'specialism'
        ? 'technical'
        : card.path === 'crisis'
          ? 'technical'
          : card.path

  return { points: Math.floor(raw * mult), happiness, growth, path }
}

function autoRate(state: GameState, cardId: string): Rating {
  const card = CARD_BY_ID[cardId]
  if (!card || card.kind === 'crisis') return 'notShown'
  return rateCard(state, cardId, card.path, card.kind)
}

export const RATING_LABELS: Record<Rating, string> = {
  notShown: 'Not shown',
  emerging: 'Emerging',
  consistent: 'Consistent',
  roleModel: 'Role model',
}

function emptyLines(): Record<PathId, PathLine[]> {
  return { delivery: [], technical: [], collaboration: [], leadership: [], commitment: [] }
}

export interface NeglectRisk {
  fed: boolean
  /** Unfed-Review streak after this Review (0 when fed or waived). */
  streakAfter: number
  threshold: number
  /** What lands if this Review leaves the path unfed at threshold. */
  consequence: null | { kind: 'drift' } | { kind: 'crisis'; crisisId: string }
}

export interface ReviewBreakdown {
  ratings: Record<string, Rating>
  /** Everything except neglect Drift, which depends on the neglect counters mutating. */
  delta: PathScores
  lines: Record<PathId, PathLine[]>
  happiness: number
  cardGrowth: number
  commitDelta: number
  moralePenalty: boolean
  crisisNotes: string[]
  idleBlocks: number
  neglect: Record<PathId, NeglectRisk>
}

/** Path a slotted card's mentor points land on (specialisms → Technical, cross → Collaboration). */
export function cardScoringPath(card: CardDef): PathId | null {
  if (card.kind === 'crisis') return null
  if (card.kind === 'cross') return 'collaboration'
  if (card.kind === 'specialism') return 'technical'
  return card.path === 'crisis' ? 'technical' : card.path
}

export const PATH_FEEDING_ACTIONS: Record<PathId, string[]> = {
  delivery: ['drawing-set', 'design-review', 'timesheets'],
  technical: ['calc-package', 'model-layouts', 'automate', 'cpd-friday', 'learn-revit'],
  collaboration: ['work-across', 'client-meeting', 'clash-cycle', 'lunch-learn', 'site-visit'],
  leadership: ['ask-mentor', 'mentor-junior', 'peer-check', 'ask-feedback'],
  commitment: [],
}

/** Itemised Review scoring from the current cycle's evidence. Pure — safe for live Desk previews. */
export function computeReviewBreakdown(state: GameState): ReviewBreakdown {
  let ratings: Record<string, Rating> = {}
  for (const id of state.slotted) ratings[id] = autoRate(state, id)
  ratings = enforceRoleModelCap(state.grade, ratings)

  const actionCounts = state.actionsThisReview.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1
    return acc
  }, {})
  const disciplineCount = Math.max(2, state.projects[0]?.allies.length ?? 2)
  const cfg = gateConfig(state.grade)
  const delta = emptyPaths()
  const lines = emptyLines()
  const add = (p: PathId, amount: number, label: string, kind: PathLine['kind']) => {
    delta[p] += amount
    lines[p].push({ label, amount, kind })
  }
  let happiness = 0
  let cardGrowth = 0
  const crisisNotes: string[] = []

  for (const p of PATHS) add(p, cfg.base, 'Base (every Review)', 'base')

  const pathCarded = emptyPaths()
  for (const id of state.slotted) {
    const card = CARD_BY_ID[id]
    if (!card) continue
    if (card.kind === 'crisis') {
      const pen = card.penalty ?? {}
      for (const p of PATHS) {
        if (typeof pen[p] === 'number') add(p, pen[p] as number, `Crisis: ${card.name}`, 'crisis')
      }
      happiness += pen.happiness ?? 0
      crisisNotes.push(`Crisis ${card.name} bites.`)
      continue
    }
    if (state.specialistWaive && card.path === state.specialistWaive) continue
    const scored = scoreCard(card, ratings[id], actionCounts, disciplineCount)
    let pts = scored.points
    if (state.specialistWaive && scored.path === 'technical') pts = Math.floor(pts * 1.5)
    add(scored.path, pts, `${card.name} card · rated ${RATING_LABELS[ratings[id]]}`, 'card')
    pathCarded[scored.path] += 1
    happiness += scored.happiness
    cardGrowth += scored.growth
  }

  for (const id of state.slotted) {
    const card = CARD_BY_ID[id]
    if (card?.kind !== 'cross') continue
    const lineage = state.slotted.filter((sid) => CARD_BY_ID[sid]?.kind === 'specialism').length
    const bonus = Math.min(2, lineage)
    if (bonus) add('collaboration', bonus, `${card.name} lineage (specialisms slotted)`, 'lineage')
  }

  const rawCommit =
    commitmentPathDeltaFromActions(actionCounts) + Math.min(2, state.pendingCommitment ?? 0)
  const commitDelta = Math.min(3, rawCommit)
  if (commitDelta) add('commitment', commitDelta, 'Desk commitment work & events (cap +3)', 'commitment')

  const moralePenalty =
    ['senior', 'associate', 'bimLead', 'leadCoordinator'].includes(state.grade) && happiness < 0
  if (moralePenalty) for (const p of PATHS) add(p, -1, 'Team morale check failed', 'morale')

  const gradeDef = GRADES[state.grade]
  for (const m of gradeDef.milestones) {
    if (state.milestonesHit.includes(m.id)) add(m.path, 1, `Milestone: ${m.label}`, 'milestone')
  }

  // Each −8h idle block this cycle costs −1 Delivery (no billable output).
  const idleBlocks = actionCounts['unutilized'] ?? 0
  if (idleBlocks > 0) add('delivery', -idleBlocks, `Unutilized time ×${idleBlocks} (−1 each)`, 'idle')

  for (const p of PATHS) {
    if (pathCarded[p] > 0 || p === 'commitment') continue
    const n = PATH_FEEDING_ACTIONS[p].reduce((s, id) => s + (actionCounts[id] ?? 0), 0)
    if (n > 0) {
      lines[p].push({
        label: `${n} ${PATH_LABELS[p]} action${n === 1 ? '' : 's'} earned no card points — no ${PATH_LABELS[p]} card slotted`,
        amount: 0,
        kind: 'hint',
      })
    }
  }

  const neglectThreshold = state.grade === 'graduate' || state.grade === 'technician' ? 3 : 2
  const neglect = {} as Record<PathId, NeglectRisk>
  for (const p of PATHS) {
    // Graduate/Technician: commitment neglect is softer (threshold +1)
    const threshold =
      p === 'commitment' && (state.grade === 'graduate' || state.grade === 'technician')
        ? neglectThreshold + 1
        : neglectThreshold
    if (state.specialistWaive === p) {
      neglect[p] = { fed: true, streakAfter: 0, threshold, consequence: null }
      continue
    }
    const fed = pathCarded[p] > 0 || (p === 'commitment' && commitDelta > 0)
    const streakAfter = fed ? 0 : (state.neglect[p] ?? 0) + 1
    let consequence: NeglectRisk['consequence'] = null
    if (streakAfter >= threshold) {
      const crisisId = crisisForPath(state.grade, p)
      if (crisisId === 'drift') consequence = { kind: 'drift' }
      else if (crisisId && !state.crises.includes(crisisId)) consequence = { kind: 'crisis', crisisId }
    }
    neglect[p] = { fed, streakAfter, threshold, consequence }
  }

  return {
    ratings,
    delta,
    lines,
    happiness,
    cardGrowth,
    commitDelta,
    moralePenalty,
    crisisNotes,
    idleBlocks,
    neglect,
  }
}

export interface ReviewProjection {
  breakdown: ReviewBreakdown
  delta: PathScores
  lines: Record<PathId, PathLine[]>
  totals: PathScores
  gatePass: boolean
  monthsToReview: number
}

/** "If the Review were held today" — current cycle evidence projected onto path totals. */
export function projectReview(state: GameState): ReviewProjection {
  const breakdown = computeReviewBreakdown(state)
  const delta = { ...breakdown.delta }
  const lines = clone(breakdown.lines)
  for (const p of PATHS) {
    if (breakdown.neglect[p].consequence?.kind === 'drift') {
      delta[p] -= 2
      lines[p].push({ label: `${PATH_LABELS[p]} Drift — unfed ${breakdown.neglect[p].streakAfter} Reviews`, amount: -2, kind: 'neglect' })
    }
  }
  const totals = emptyPaths()
  for (const p of PATHS) totals[p] = state.paths[p] + delta[p]
  return {
    breakdown,
    delta,
    lines,
    totals,
    gatePass: checkGate(totals, gateConfig(state.grade), state.specialistWaive, state.grade),
    monthsToReview: 6 - monthInCycle(state) + 1,
  }
}

export function beginReview(state: GameState): GameState {
  const next = clone(state)
  // Resolve overdue inbox
  for (const item of next.inbox) {
    if (item.resolved) continue
    if (item.monthsLeft <= 0) {
      applyResource(next.resources, 'reputation', -2, next.burnoutTurns > 0)
      applyResource(next.resources, 'fee', -1, next.burnoutTurns > 0)
      pushLog(next, `Late interface: deadline missed. Rework risk lands.`, 'bad')
      item.resolved = true
    }
  }

  const bd = computeReviewBreakdown(next)
  const { ratings, commitDelta, moralePenalty } = bd
  const cfg = gateConfig(next.grade)
  const delta = { ...bd.delta }
  const pathLines = clone(bd.lines)
  let growthGain = bd.cardGrowth
  const notes: string[] = [...bd.crisisNotes]
  const slotsUsed = next.slotted.filter((id) => !next.crises.includes(id)).length
  const slotsMax = slotCount(next)

  if (commitDelta) {
    notes.push(
      `Commitment: +${commitDelta} (desk/events; soft-capped at +3 this Review)`,
    )
  }
  next.pendingCommitment = 0

  const crisesDrawn: string[] = []
  for (const p of PATHS) {
    const risk = bd.neglect[p]
    next.neglect[p] = risk.streakAfter
    if (next.neglect[p] < risk.threshold) continue
    const crisisId = crisisForPath(next.grade, p)
    if (crisisId === 'drift') {
      delta[p] -= 2
      pathLines[p].push({ label: `${PATH_LABELS[p]} Drift — no ${PATH_LABELS[p]} card for ${risk.streakAfter} Reviews`, amount: -2, kind: 'neglect' })
      notes.push(`${p} Drift (−2).`)
      next.neglect[p] = 0
    } else if (crisisId && !next.crises.includes(crisisId)) {
      if (drawCrisis(next, crisisId)) {
        crisesDrawn.push(crisisId)
        notes.push(
          `Crisis drawn: ${CARD_BY_ID[crisisId]?.name}. Slot its clearer habit on Cards before promotion.`,
        )
      }
      next.neglect[p] = 0
    }
  }

  next.actionPlan.lastReviewedTurn = next.turn
  notes.push(
    `Development Action Plan revisited: short “${next.actionPlan.short.slice(0, 48)}…”`,
  )

  if (moralePenalty) notes.push('Morale check failed: −1 all paths.')

  if (bd.idleBlocks > 0) {
    notes.push(
      `Unutilized ×${bd.idleBlocks}: yields already logged (−Fee/−Wellbeing per block; Competence/Reputation/Network/Growth earned nothing). Delivery path −${bd.idleBlocks} this Review.`,
    )
  }

  for (const p of PATHS) {
    delta[p] = Math.floor(delta[p])
    next.paths[p] += delta[p]
  }

  const actionCounts = next.actionsThisReview.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1
    return acc
  }, {})

  // Growth: tighter caps so a grade takes several Reviews
  const cpdBlocks =
    (actionCounts['cpd-friday'] ?? 0) + (actionCounts['chartership-log'] ?? 0)
  growthGain += Math.min(2, cpdBlocks)
  let pathGrowth = 0
  for (const p of PATHS) {
    if (next.paths[p] >= cfg.golden) pathGrowth += 1
    else if (next.paths[p] >= cfg.m2) pathGrowth += 1
  }
  growthGain += Math.min(2, pathGrowth)
  growthGain = Math.min(5, Math.max(0, Math.floor(growthGain)))
  next.resources.growth += growthGain
  next.growthBanked = next.resources.growth

  const gatePass = checkGate(next.paths, cfg, next.specialistWaive, next.grade)
  if (gatePass) next.consecutiveGate += 1
  else next.consecutiveGate = 0

  const snapshot: ReviewSnapshot = {
    turn: next.turn,
    ratings,
    pathDelta: delta,
    pathTotals: { ...next.paths },
    growthGained: growthGain,
    crisesDrawn,
    gatePass,
    moralePenalty,
    notes,
    pathLines,
    slotsUsed,
    slotsMax,
  }
  next.lastReview = snapshot
  next.reviewsDone += 1
  pushHistory(next, {
    kind: 'review',
    turn: next.turn,
    grade: next.grade,
    monthInGrade: next.monthInGrade,
    pathTotals: { ...next.paths },
    pathDelta: { ...delta },
    gatePass,
    streak: next.consecutiveGate,
    growthBanked: next.growthBanked,
  })
  next.actionsThisReview = []
  next.actionMonthsThisReview = {}
  next.positiveFeedbackThisReview = false
  next.screen = 'review'
  pushLog(next, `Six-monthly review complete. Gate ${gatePass ? 'passed' : 'missed'}.`, gatePass ? 'good' : 'warn')
  return next
}

function crisisForPath(grade: GradeId, path: PathId): string {
  if (path === 'commitment') return 'corner-cut'
  const table: Record<string, Partial<Record<PathId, string>>> = {
    graduate: { collaboration: 'island-mentality', leadership: 'silent-struggle', commitment: 'corner-cut' },
    engineer: {
      delivery: 'late-alarm',
      technical: 'my-way-only',
      collaboration: 'island-mentality',
      commitment: 'corner-cut',
    },
    senior: { delivery: 'isolated-verdict', leadership: 'problem-spotter', commitment: 'corner-cut' },
    associate: { delivery: 'unclaimed-helm', leadership: 'command-without-trust', commitment: 'corner-cut' },
    technician: {
      delivery: 'issue-day',
      collaboration: 'guesswork-geometry',
      commitment: 'corner-cut',
    },
    seniorTechnician: { delivery: 'revision-drift', commitment: 'corner-cut' },
    bimLead: { leadership: 'standards-for-their-own-sake', commitment: 'corner-cut' },
  }
  return table[grade]?.[path] ?? 'drift'
}

function checkGate(
  paths: PathScores,
  cfg: ReturnType<typeof gateConfig>,
  waive: PathId | null,
  grade: GradeId,
): boolean {
  let strong = 0
  for (const p of PATHS) {
    if (waive === p) continue
    // Commitment at M1 required from Engineer grade onward (grades.md)
    if (p === 'commitment' && !commitmentRequired(grade)) continue
    if (paths[p] < cfg.m1) return false
    if (paths[p] >= cfg.m2) strong += 1
  }
  return strong >= cfg.gateStrong
}

export function setLoadout(state: GameState, slotted: string[]): GameState {
  const next = clone(state)
  const max = slotCount(next)
  // crises always consume slots
  const crises = next.crises.filter((id) => slotted.includes(id) || true)
  const withoutCrisis = slotted.filter((id) => !next.crises.includes(id))
  next.slotted = [...next.crises, ...withoutCrisis.filter((id) => !crises.includes(id))].slice(
    0,
    Math.max(next.crises.length, max),
  )
  // ensure unique
  next.slotted = [...new Set(next.slotted)].slice(0, max + (next.crises.length > max ? next.crises.length - max : 0))
  // simpler: crises mandatory + fill
  const picks = withoutCrisis.filter((id) => CARD_BY_ID[id] && CARD_BY_ID[id].kind !== 'crisis')
  next.slotted = [...next.crises, ...picks].slice(0, Math.max(max, next.crises.length))
  return next
}

export function toggleCard(state: GameState, cardId: string): GameState {
  const next = clone(state)
  if (next.crises.includes(cardId)) return next // cannot remove until cleared
  const max = slotCount(next)
  if (next.slotted.includes(cardId)) {
    next.slotted = next.slotted.filter((id) => id !== cardId)
  } else {
    const nonCrisis = next.slotted.filter((id) => !next.crises.includes(id))
    if (next.slotted.length >= max) {
      // replace last non-crisis
      if (!nonCrisis.length) return next
      const drop = nonCrisis[nonCrisis.length - 1]
      next.slotted = next.slotted.filter((id) => id !== drop)
    }
    next.slotted.push(cardId)
  }
  return next
}

function drawCrisis(state: GameState, crisisId: string): boolean {
  // Graduate/Technician: at most one crisis at a time
  if (
    (state.grade === 'graduate' || state.grade === 'technician') &&
    state.crises.length >= 1
  ) {
    return false
  }
  if (state.crises.includes(crisisId)) return false
  state.crises.push(crisisId)
  // Auto-offer clearer habit into loadout when possible
  const clearer = CARD_BY_ID[crisisId]?.clearedBy
  if (clearer && !state.slotted.includes(clearer)) {
    const max = slotCount(state)
    const nonCrisis = state.slotted.filter((id) => !state.crises.includes(id))
    if (state.slotted.length < max) {
      state.slotted.push(clearer)
    } else if (nonCrisis.length) {
      const drop = nonCrisis[nonCrisis.length - 1]!
      state.slotted = state.slotted.filter((id) => id !== drop)
      state.slotted.push(clearer)
    }
    pushLog(
      state,
      `Cards: slotted “${CARD_BY_ID[clearer]?.name ?? clearer}” to clear ${CARD_BY_ID[crisisId]?.name}. Keep it Consistent next Review.`,
      'warn',
    )
  }
  return true
}

export function finishReview(state: GameState): GameState {
  const next = clone(state)

  // Clear crises if clearer habit was slotted Emerging+ (was Consistent-only — softlock risk)
  if (next.lastReview) {
    for (const crisisId of [...next.crises]) {
      const crisis = CARD_BY_ID[crisisId]
      const clearer = crisis?.clearedBy
      const rating = clearer ? next.lastReview.ratings[clearer] : undefined
      if (
        clearer &&
        next.slotted.includes(clearer) &&
        (rating === 'emerging' || rating === 'consistent' || rating === 'roleModel')
      ) {
        next.crises = next.crises.filter((id) => id !== crisisId)
        pushLog(next, `Cleared crisis: ${crisis?.name} (via ${CARD_BY_ID[clearer]?.name}).`, 'good')
      }
    }
  }

  if (canPromoteNormal(next)) {
    next.screen = 'promotion'
    pushLog(next, 'Promotion ready. Mentor review unlocked.', 'good')
    return next
  }

  // Early route is opt-in from Self (Request early promotion) — not auto after Review
  next.screen = 'cards'
  if (next.crises.length) {
    const hints = next.crises
      .map((id) => {
        const c = CARD_BY_ID[id]
        return c?.clearedBy ? `${c.name} ← ${CARD_BY_ID[c.clearedBy]?.name}` : c?.name
      })
      .join('; ')
    pushLog(next, `Crisis lock — clear before promotion: ${hints}`, 'warn')
  } else {
    pushLog(next, 'Set your loadout for the next six months.', 'neutral')
  }
  return next
}

export function promote(state: GameState, keepHabitId?: string): GameState {
  const next = clone(state)
  const grade = GRADES[next.grade]
  const nextId = grade.next
  if (!nextId) {
    // win via legacy
    const top = PATHS.reduce((a, b) => (next.paths[a] >= next.paths[b] ? a : b))
    const epilogues: Record<PathId, string> = {
      technical: 'Recognised as the go-to expert. Technical Director path opens.',
      leadership: 'You lead a multi-discipline wonder. Practice leadership beckons.',
      delivery: 'Client account growth puts commercial leadership in reach.',
      collaboration: 'Your talks and networks start shaping guidance beyond the firm.',
      commitment:
        'Chartered practice — you mentor others through Professional Review and feed the Influence legacy.',
    }
    // map collaboration→Influence legacy, delivery→Commercial
    next.ended = {
      win: true,
      path: top,
      epilogue: epilogues[top],
    }
    next.screen = 'win'
    return next
  }

  // Golden Age carry
  const cfg = gateConfig(next.grade)
  let freeHabit: string | null = null
  for (const p of PATHS) {
    if (next.paths[p] >= cfg.golden && keepHabitId) {
      const card = CARD_BY_ID[keepHabitId]
      if (card?.kind === 'habit' && card.path === p) freeHabit = keepHabitId
    }
  }

  pushHistory(next, {
    kind: 'promotion',
    turn: next.turn,
    grade: next.grade,
    monthInGrade: next.monthInGrade,
    toGrade: nextId,
  })
  next.grade = nextId
  next.monthInGrade = 1
  next.paths = emptyPaths()
  next.neglect = emptyPaths()
  next.consecutiveGate = 0
  next.milestonesHit = []
  next.milestoneProgress = {}
  next.crises = []
  // Soft-reset Growth — carry ≤30% and always below the next grade's need
  const nextNeed = growthNeedFor(nextId)
  const carried = Math.min(Math.floor(next.growthBanked * 0.3), Math.max(0, nextNeed - 1))
  next.growthBanked = carried
  next.resources.growth = carried
  next.celebrationSlots = 1
  next.celebrationExpires = next.turn + 6
  next.projects = demoProjects(nextId)
  next.inboxUsed = []
  refreshInbox(next)

  // unlock next specialism if any
  const nextSpecs = specialismsFor(nextId, next.discipline, next.unlockedSpecialisms)
  for (const s of nextSpecs) {
    if (s.stage === nextId && !next.unlockedSpecialisms.includes(s.id)) {
      next.unlockedSpecialisms.push(s.id)
    }
  }
  if (nextId === 'senior' || nextId === 'bimLead') {
    for (const id of ['coordinated-services', 'cause-and-effect-pact']) {
      if (!next.unlockedSpecialisms.includes(id)) next.unlockedSpecialisms.push(id)
    }
  }

  const newHabits = habitsForGrade(nextId)
  const defaultHabit = newHabits[0]?.id
  const defaultSpec =
    next.unlockedSpecialisms.find((id) => CARD_BY_ID[id]?.stage === nextId) ??
    next.unlockedSpecialisms[0]
  next.slotted = [defaultHabit, defaultSpec, freeHabit].filter(Boolean).slice(0, GRADES[nextId].slots) as string[]

  next.justPromoted = true
  next.screen = 'promotion'
  pushLog(next, `Promoted to ${GRADES[nextId].name}. Celebration +1 slot for six months.`, 'good')
  return next
}

export function continueAfterPromotion(state: GameState): GameState {
  const next = clone(state)
  if (next.ended) {
    next.screen = 'win'
    return next
  }
  next.justPromoted = false
  next.screen = 'desk'
  pushLog(next, `${GRADES[next.grade].name} desk. ${GRADES[next.grade].theme}`, 'good')
  return next
}

export function resolveEventChoice(state: GameState, choiceId: string): GameState {
  const next = clone(state)
  const ev = EVENTS.find((e) => e.id === next.pendingEvent)
  if (!ev) {
    next.screen = 'desk'
    next.pendingEvent = null
    next.pendingClaim = null
    return next
  }
  // If event has UK-SPEC elements, pause for "I / contributed / we" claim
  if (ev.elements?.length) {
    next.pendingClaim = { eventId: ev.id, choiceId }
    next.screen = 'event'
    return next
  }
  return applyEventChoice(next, ev.id, choiceId, 'contributed')
}

export function resolveEventClaim(state: GameState, claim: ClaimRole): GameState {
  const next = clone(state)
  if (!next.pendingClaim) {
    next.screen = 'desk'
    return next
  }
  const { eventId, choiceId } = next.pendingClaim
  return applyEventChoice(next, eventId, choiceId, claim)
}

function applyEventChoice(
  state: GameState,
  eventId: string,
  choiceId: string,
  claim: ClaimRole,
): GameState {
  const next = state
  const ev = EVENTS.find((e) => e.id === eventId)
  if (!ev) {
    next.screen = 'desk'
    next.pendingEvent = null
    next.pendingClaim = null
    return next
  }
  const choice = ev.choices.find((c) => c.id === choiceId) ?? ev.choices[0]
  const burnout = next.burnoutTurns > 0
  for (const [k, v] of Object.entries(choice.effects)) {
    if (k === 'hours') next.resources.hours = Math.max(0, next.resources.hours + (v as number))
    else if (k === 'commitmentPath') {
      const delta = Math.max(-1, Math.min(2, v as number))
      next.pendingCommitment = Math.min(3, Math.max(0, (next.pendingCommitment ?? 0) + delta))
    } else if (k in next.resources)
      applyResource(next.resources, k as keyof Resources, v as number, burnout)
  }
  if (choice.drawsCornerCut) {
    if (drawCrisis(next, 'corner-cut')) {
      pushLog(next, 'Corner Cut Crisis: professional commitment neglected.', 'bad')
    }
  }
  if (ev.elements?.length) {
    const effectiveClaim = choice.drawsCornerCut ? 'we' : claim
    logEvidence(next, {
      source: 'event',
      title: ev.title,
      elements: ev.elements,
      claim: effectiveClaim,
      note: choice.result,
    })
    if (ev.elements.some((e) => e.startsWith('E')) && effectiveClaim !== 'we') {
      addCpdHours(next, 2, false)
    }
  }
  pushLog(next, `Event: ${ev.title} — ${choice.result}`, 'neutral')
  next.pendingEvent = null
  next.pendingClaim = null
  next.screen = 'desk'
  return next
}

export function setCharterBody(
  state: GameState,
  body: GameState['charterBody'],
): GameState {
  const next = clone(state)
  next.charterBody = body
  pushLog(
    next,
    `Chartership body: ${body === 'engineersIreland' ? 'Engineers Ireland' : 'CIBSE / IET (UK-SPEC)'}.`,
    'good',
  )
  return next
}

export function updateActionPlan(
  state: GameState,
  plan: Partial<GameState['actionPlan']>,
): GameState {
  const next = clone(state)
  next.actionPlan = { ...next.actionPlan, ...plan, lastReviewedTurn: next.turn }
  return next
}

export function attemptCharterReview(state: GameState): GameState {
  const next = clone(state)
  if (!canAttemptProfessionalReview(next)) {
    pushLog(
      next,
      'Professional Review locked: every UK-SPEC element needs at least “demonstrated” evidence.',
      'warn',
    )
    return next
  }
  const result = runProfessionalReview(next)
  next.screen = 'charterReview'
  pushLog(
    next,
    result.passed ? 'Professional Review: pass.' : 'Professional Review: deferred.',
    result.passed ? 'good' : 'warn',
  )
  return next
}

export function finishCharterReview(state: GameState): GameState {
  const next = clone(state)
  next.screen = 'self'
  return next
}

export function setScreen(state: GameState, screen: GameState['screen']): GameState {
  if (state.ended && screen !== 'win' && screen !== 'title') return state
  return { ...state, screen }
}

export function saveGame(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

export function loadGame(): GameState | null {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('career-civics-save-v2')
    if (!raw) return null
    const state = JSON.parse(raw) as GameState
    if (!state.monthStartResources) state.monthStartResources = clone(state.resources)
    if (!state.milestoneProgress) state.milestoneProgress = {}
    if (!state.actionMonthsThisReview) state.actionMonthsThisReview = {}
    if (!state.inbox) state.inbox = []
    if (!state.inboxUsed) state.inboxUsed = []
    if (!state.ties) state.ties = defaultTies(state.discipline)
    if (!state.feedbackLog) state.feedbackLog = []
    if (state.positiveFeedbackThisReview == null) state.positiveFeedbackThisReview = false
    if (!state.wellbeingFloor) state.wellbeingFloor = 4
    if (state.paths && state.paths.commitment == null) state.paths.commitment = 0
    if (state.neglect && state.neglect.commitment == null) state.neglect.commitment = 0
    if (!state.charterBody) state.charterBody = 'cibse'
    if (!state.sponsor) state.sponsor = defaultSponsor(state.discipline)
    if (!state.actionPlan) state.actionPlan = defaultActionPlan(state.grade)
    if (!state.elementStrength) state.elementStrength = emptyEvidenceMap()
    if (!state.charterLog) state.charterLog = []
    if (!state.cpd) state.cpd = { plannedHours: 0, unplannedHours: 0, yearStartTurn: 1 }
    if (!state.professionalReview) {
      state.professionalReview = {
        attempted: false,
        passed: false,
        deferredElements: [],
        notes: [],
      }
    }
    if (state.pendingClaim === undefined) state.pendingClaim = null
    if (state.pendingCommitment == null) state.pendingCommitment = 0
    if (!state.careerHistory) {
      state.careerHistory = state.lastReview
        ? [
            {
              kind: 'review',
              turn: state.lastReview.turn,
              grade: state.grade,
              monthInGrade: state.monthInGrade,
              pathTotals: { ...state.lastReview.pathTotals },
              pathDelta: { ...state.lastReview.pathDelta },
              gatePass: state.lastReview.gatePass,
              streak: state.consecutiveGate,
              growthBanked: state.growthBanked,
            },
          ]
        : []
    }
    ensureChartership(state)
    for (const cell of state.grid ?? []) {
      if (cell.evidence == null) cell.evidence = cell.level >= 1 ? 2 : 0
      if (cell.confirmed == null) cell.confirmed = cell.revealed && cell.level >= 3
    }
    return state
  } catch {
    return null
  }
}

export function resolveInbox(
  state: GameState,
  defId: string,
  choiceId: string,
): GameState {
  const next = clone(state)
  const item = next.inbox.find((i) => i.defId === defId && !i.resolved)
  const def = INBOX_POOL.find((d) => d.id === defId)
  if (!item || !def || next.screen !== 'desk') return state
  const choice = def.choices.find((c) => c.id === choiceId) ?? def.choices[0]
  const hours = choice.hours ?? 0
  if (hours > next.resources.hours) {
    pushLog(next, 'Not enough hours for that inbox choice.', 'warn')
    return next
  }
  next.resources.hours -= hours
  const burnout = next.burnoutTurns > 0
  const fx = choice.effects ?? {}
  for (const key of ['competence', 'reputation', 'network', 'fee', 'wellbeing', 'growth'] as const) {
    if (fx[key]) applyResource(next.resources, key, fx[key]!, burnout)
  }
  if (fx.projectProgress && next.projects[0]) {
    next.projects[0].progress = Math.min(100, next.projects[0].progress + fx.projectProgress)
  }
  if (fx.tieDelta) {
    const tie = next.ties.find(
      (t) => t.role.toLowerCase().includes(String(def.from)) || t.id.includes(String(def.from).slice(0, 3)),
    )
    if (tie) tie.strength = Math.min(3, Math.max(0, tie.strength + fx.tieDelta))
  }
  if (choice.risk === 'rework' && Math.random() < 0.35) {
    applyResource(next.resources, 'reputation', -1, burnout)
    if (next.projects[0]) next.projects[0].clashes += 1
    pushLog(next, `Rework risk lands: ${def.ifLate}`, 'bad')
  }
  item.resolved = true
  if (!next.inboxUsed.includes(defId)) next.inboxUsed.push(defId)
  pushLog(next, `Inbox: ${def.title} — ${choice.result}`, 'neutral')
  if (next.resources.wellbeing <= next.wellbeingFloor && next.burnoutTurns <= 0) {
    next.burnoutTurns = 3
    pushLog(next, `Burnout (Wellbeing ≤ ${next.wellbeingFloor}).`, 'bad')
  }
  return next
}

/** Re-export Self helpers for screens. */
export {
  topGaps,
  promotionReady,
  promotionBlockers,
  crisisClearHint,
  growthNeedFor,
  monthInCycle,
} from './progress'
export { milestonesFor } from '../data/milestones'
export { expectedLevel, nextGradeId } from '../data/expectations'
export {
  canAttemptProfessionalReview,
  cpdProgress,
} from './chartership'

export function clearSave() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('career-civics-save-v2')
  } catch {
    /* ignore */
  }
}

export function monthActions(state: GameState): ActionDef[] {
  return actionsFor(state.track, state.grade)
}

export function promotionEvidence(state: GameState) {
  const grade = GRADES[state.grade]
  const cfg = gateConfig(state.grade)
  return {
    grade,
    cfg,
    milestonesHit: grade.milestones.map((m) => ({
      ...m,
      hit: state.milestonesHit.includes(m.id),
    })),
    gateStreak: state.consecutiveGate,
    growth: state.growthBanked,
    crises: state.crises,
  }
}
