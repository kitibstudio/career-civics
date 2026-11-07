import { ACTIONS, EVENTS, actionsFor, pickEvent } from '../data/actions'
import {
  CARD_BY_ID,
  habitsForGrade,
  specialismsFor,
  startingHabit,
  startingSpecialism,
} from '../data/cards'
import { CHARACTERS } from '../data/characters'
import { GRADES, STAGE_ORDER, gateConfig } from '../data/grades'
import type {
  ActionDef,
  CardDef,
  GameState,
  GradeId,
  GridCell,
  PathId,
  PathScores,
  Rating,
  Resources,
  ReviewSnapshot,
  SkillId,
  StageId,
} from '../data/types'

const PATHS: PathId[] = ['delivery', 'technical', 'collaboration', 'leadership']
const STORAGE_KEY = 'career-civics-save-v1'

const RATING_MULT: Record<Rating, number> = {
  notShown: 0,
  emerging: 0.5,
  consistent: 1,
  roleModel: 1.5,
}

function emptyPaths(): PathScores {
  return { delivery: 0, technical: 0, collaboration: 0, leadership: 0 }
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function pushLog(state: GameState, text: string, tone: GameState['log'][0]['tone'] = 'neutral') {
  state.log = [{ turn: state.turn, text, tone }, ...state.log].slice(0, 40)
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
      const base = skills[skill] ?? 0
      const soft = skill !== 'technical'
      cells.push({
        skill,
        stage,
        level: Math.max(0, base),
        selfRating: Math.max(0, base + (soft ? 1 : 0)),
        revealed: !soft,
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

export function createNewGame(characterId: string): GameState {
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
    grid: makeGrid(character.skills),
    projects: demoProjects(grade),
    actionsThisMonth: [],
    actionsThisReview: [],
    pendingEvent: null,
    reviewsDone: 0,
    lastReview: null,
    log: [],
    tipSeen: false,
    software: {
      autocad: character.id === 'sam',
      revit: false,
    },
    ended: null,
    burnoutTurns: 0,
    justPromoted: false,
  }

  pushLog(
    state,
    `Welcome, ${character.name}. Second Pair of Eyes is always on. Slot Habits and Specialisms, then spend your hours.`,
    'good',
  )
  return state
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

function bumpGrid(state: GameState, skill?: SkillId, stage?: StageId) {
  if (!skill || !stage) return
  const cell = state.grid.find((c) => c.skill === skill && c.stage === stage)
  if (!cell) return
  if (Math.random() < 0.55) cell.level = Math.min(5, cell.level + 1)
  if (!cell.revealed) cell.selfRating = Math.min(5, cell.selfRating + 1)
}

function revealFeedback(state: GameState) {
  const hidden = state.grid.filter((c) => !c.revealed)
  if (!hidden.length) return
  const cell = hidden[Math.floor(Math.random() * hidden.length)]
  cell.revealed = true
  // sometimes feedback is lower than self-rating
  if (Math.random() < 0.35) cell.level = Math.max(0, cell.selfRating - 1)
  else cell.level = Math.max(cell.level, Math.min(5, cell.selfRating))
  pushLog(
    state,
    `Feedback reveals ${cell.skill} @ ${cell.stage}: level ${cell.level} (you thought ${cell.selfRating}).`,
    cell.level < cell.selfRating ? 'warn' : 'good',
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
  if (action.hours < 0) return true // overtime adds hours
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
  if (tags.has('collaboration') || tags.has('coordination') || tags.has('network')) {
    pathLean.push('collaboration')
  }
  if (tags.has('leadership') || tags.has('feedback')) pathLean.push('leadership')

  let reviewHint: string | undefined
  if (action.id === 'unutilized') {
    reviewHint = 'Review: −1 Delivery per idle block this cycle'
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

  if (effects.milestone && !next.milestonesHit.includes(effects.milestone)) {
    // site visits need accumulation
    if (effects.milestone === 'siteVisits') {
      const count = next.actionsThisReview.filter((a) => a === 'site-visit').length + 1
      if (count >= 3) {
        next.milestonesHit.push('siteVisits')
        pushLog(next, 'Milestone: site visit log is looking real.', 'good')
      }
    } else {
      next.milestonesHit.push(effects.milestone)
      pushLog(next, `Milestone progress: ${effects.milestone}`, 'good')
    }
  }

  if (action.id === 'learn-revit') next.software.revit = true
  if (effects.revealFeedback) revealFeedback(next)
  bumpGrid(next, effects.skill, effects.stage)

  // Black Box risk if automate without tinkerer's bench / toolsmith / human check habit
  if (
    action.id === 'automate' &&
    !next.slotted.includes('tinkerers-bench') &&
    !next.slotted.includes('toolsmith') &&
    Math.random() < 0.22 &&
    !next.crises.includes('black-box')
  ) {
    next.crises.push('black-box')
    pushLog(next, 'Black Box Crisis: unchecked automation output was nearly issued.', 'bad')
  }

  next.actionsThisMonth.push(actionId)
  next.actionsThisReview.push(actionId)
  const uses = next.actionsThisMonth.filter((id) => id === actionId).length
  if (action.id === 'unutilized') {
    pushLog(
      next,
      `Logged unutilized block ×${uses} (−8h, −1 Fee, −1 Wellbeing; −1 Delivery at review).`,
      'warn',
    )
  } else {
    pushLog(next, `Did: ${action.name}${uses > 1 ? ` (×${uses} this month)` : ''}`, 'neutral')
  }

  if (next.resources.wellbeing <= 0 && next.burnoutTurns <= 0) {
    next.burnoutTurns = 6
    pushLog(next, 'Burnout. Yields halved for 6 turns. Force a wellbeing recovery.', 'bad')
  }

  return next
}

export function endMonth(state: GameState): GameState {
  const next = clone(state)
  if (next.screen !== 'desk' || next.ended) return state

  // leftover hours are still idle — nudge the player; scoring needs explicit Unutilized blocks
  const leftover = next.resources.hours
  const idleBlocks = next.actionsThisMonth.filter((id) => id === 'unutilized').length
  if (leftover >= 8) {
    const suggested = Math.floor(leftover / 8)
    pushLog(
      next,
      `${leftover}h left unspent. Log Unutilized time (−8h) ${suggested}× next time — idle hours still cost Fee/Wellbeing now and −1 Delivery each at review.`,
      'warn',
    )
  } else if (idleBlocks >= 3) {
    pushLog(
      next,
      `Heavy idle month (${idleBlocks} unutilized blocks). Expect Delivery to take the hit at review.`,
      'warn',
    )
  }

  // passive founding charter CPD if diarised
  if (next.actionsThisMonth.includes('cpd-friday')) {
    applyResource(next.resources, 'growth', 1, next.burnoutTurns > 0)
  }

  next.monthInGrade += 1
  next.turn += 1
  next.actionsThisMonth = []
  next.resources.hours = 160
  if (next.burnoutTurns > 0) next.burnoutTurns -= 1

  // wellbeing drift
  if (next.resources.wellbeing > 16) next.resources.wellbeing = 16

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
  const actions = state.actionsThisReview
  const counts = actions.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1
    return acc
  }, {})

  let score = 0
  if (card.path === 'technical' || card.kind === 'specialism') {
    score += (counts['calc-package'] ?? 0) + (counts['model-layouts'] ?? 0) + (counts['automate'] ?? 0) + (counts['cpd-friday'] ?? 0)
  }
  if (card.path === 'delivery') {
    score += (counts['drawing-set'] ?? 0) + (counts['timesheets'] ?? 0) + (counts['design-review'] ?? 0)
  }
  if (card.path === 'collaboration' || card.kind === 'cross') {
    score += (counts['work-across'] ?? 0) + (counts['client-meeting'] ?? 0) + (counts['clash-cycle'] ?? 0) + (counts['lunch-learn'] ?? 0)
  }
  if (card.path === 'leadership') {
    score += (counts['ask-mentor'] ?? 0) + (counts['mentor-junior'] ?? 0) + (counts['cpd-friday'] ?? 0)
  }
  // specific habits
  if (card.id === 'seek-the-elders') score += (counts['ask-mentor'] ?? 0) * 2
  if (card.id === 'open-workshop') score += (counts['work-across'] ?? 0) * 2
  if (card.id === 'field-notes') score += (counts['site-visit'] ?? 0) * 2

  if (score >= 5) return 'roleModel'
  if (score >= 3) return 'consistent'
  if (score >= 1) return 'emerging'
  return 'notShown'
}

export function beginReview(state: GameState): GameState {
  const next = clone(state)
  const ratings: Record<string, Rating> = {}
  for (const id of next.slotted) ratings[id] = autoRate(next, id)

  const actionCounts = next.actionsThisReview.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1
    return acc
  }, {})
  const disciplineCount = Math.max(2, next.projects[0]?.allies.length ?? 2)
  const cfg = gateConfig(next.grade)
  const delta = emptyPaths()
  let happiness = 0
  let growthGain = 0
  const notes: string[] = []

  // base points each path
  for (const p of PATHS) delta[p] += cfg.base

  // card scores
  const pathCarded = emptyPaths()
  for (const id of next.slotted) {
    const card = CARD_BY_ID[id]
    if (!card) continue
    if (card.kind === 'crisis') {
      const pen = card.penalty ?? {}
      for (const p of PATHS) {
        if (typeof pen[p] === 'number') delta[p] += pen[p] as number
      }
      happiness += pen.happiness ?? 0
      notes.push(`Crisis ${card.name} bites.`)
      continue
    }
    if (next.specialistWaive && card.path === next.specialistWaive) continue
    const scored = scoreCard(card, ratings[id], actionCounts, disciplineCount)
    let pts = scored.points
    if (next.specialistWaive && scored.path === 'technical') pts = Math.floor(pts * 1.5)
    delta[scored.path] += pts
    pathCarded[scored.path] += 1
    happiness += scored.happiness
    growthGain += scored.growth
  }

  // lineage bonus for cross cards
  for (const id of next.slotted) {
    const card = CARD_BY_ID[id]
    if (card?.kind !== 'cross') continue
    const lineage = next.slotted.filter((sid) => CARD_BY_ID[sid]?.kind === 'specialism').length
    delta.collaboration += Math.min(2, lineage)
  }

  // neglect
  const crisesDrawn: string[] = []
  const neglectThreshold = next.grade === 'graduate' || next.grade === 'technician' ? 3 : 2
  for (const p of PATHS) {
    if (next.specialistWaive === p) {
      next.neglect[p] = 0
      continue
    }
    if (pathCarded[p] === 0) next.neglect[p] += 1
    else next.neglect[p] = 0

    if (next.neglect[p] >= neglectThreshold) {
      const crisisId = crisisForPath(next.grade, p)
      if (crisisId === 'drift') {
        delta[p] -= 2
        notes.push(`${p} Drift (−2).`)
        next.neglect[p] = 0
      } else if (crisisId && !next.crises.includes(crisisId)) {
        next.crises.push(crisisId)
        crisesDrawn.push(crisisId)
        notes.push(`Crisis drawn: ${CARD_BY_ID[crisisId]?.name}`)
        next.neglect[p] = 0
      }
    }
  }

  // morale check
  let moralePenalty = false
  if (['senior', 'associate', 'bimLead', 'leadCoordinator'].includes(next.grade) && happiness < 0) {
    for (const p of PATHS) delta[p] -= 1
    moralePenalty = true
    notes.push('Morale check failed: −1 all paths.')
  }

  // milestones evidence
  const gradeDef = GRADES[next.grade]
  for (const m of gradeDef.milestones) {
    if (next.milestonesHit.includes(m.id)) delta[m.path] += 1
  }

  // Unutilized time: each −8h idle block scored this cycle costs −1 Delivery
  // (no billable output, no path evidence). Immediate −1 Fee / −1 Wellbeing already applied on select.
  const idleBlocks = actionCounts['unutilized'] ?? 0
  if (idleBlocks > 0) {
    delta.delivery -= idleBlocks
    notes.push(
      `Unutilized time ×${idleBlocks}: −${idleBlocks} Delivery (each −8h idle block). Fee/Wellbeing already paid when logged.`,
    )
  }

  // round down / apply
  for (const p of PATHS) {
    delta[p] = Math.floor(delta[p])
    next.paths[p] += delta[p]
  }

  // growth banking helpers
  growthGain += Math.min(3, actionCounts['cpd-friday'] ?? 0) // CPD clause up to 3
  for (const p of PATHS) {
    if (next.paths[p] >= cfg.golden) growthGain += 2
    else if (next.paths[p] >= cfg.m2) growthGain += 1
  }
  next.resources.growth += growthGain
  next.growthBanked = next.resources.growth

  const gatePass = checkGate(next.paths, cfg, next.specialistWaive)
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
  }
  next.lastReview = snapshot
  next.reviewsDone += 1
  next.actionsThisReview = []
  next.screen = 'review'
  pushLog(next, `Six-monthly review complete. Gate ${gatePass ? 'passed' : 'missed'}.`, gatePass ? 'good' : 'warn')
  return next
}

function crisisForPath(grade: GradeId, path: PathId): string {
  const table: Record<string, Partial<Record<PathId, string>>> = {
    graduate: { collaboration: 'island-mentality', leadership: 'silent-struggle' },
    engineer: { delivery: 'late-alarm', technical: 'my-way-only' },
    senior: { delivery: 'isolated-verdict', leadership: 'problem-spotter' },
    associate: { delivery: 'unclaimed-helm', leadership: 'command-without-trust' },
    technician: { collaboration: 'guesswork-geometry' },
    seniorTechnician: { delivery: 'revision-drift' },
    bimLead: { leadership: 'standards-for-their-own-sake' },
  }
  return table[grade]?.[path] ?? 'drift'
}

function checkGate(
  paths: PathScores,
  cfg: ReturnType<typeof gateConfig>,
  waive: PathId | null,
): boolean {
  let strong = 0
  for (const p of PATHS) {
    if (waive === p) continue
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

export function finishReview(state: GameState): GameState {
  const next = clone(state)
  const cfg = gateConfig(next.grade)
  const ready =
    next.consecutiveGate >= 2 &&
    next.growthBanked >= cfg.growthNeed &&
    next.crises.length === 0 &&
    !(next.lastReview?.moralePenalty)

  // clear crises if counter habit was slotted consistently
  if (next.lastReview) {
    for (const crisisId of [...next.crises]) {
      const crisis = CARD_BY_ID[crisisId]
      const clearer = crisis?.clearedBy
      if (
        clearer &&
        next.slotted.includes(clearer) &&
        (next.lastReview.ratings[clearer] === 'consistent' ||
          next.lastReview.ratings[clearer] === 'roleModel')
      ) {
        next.crises = next.crises.filter((id) => id !== crisisId)
        next.slotted = next.slotted.filter((id) => id !== crisisId)
        pushLog(next, `Cleared crisis: ${crisis.name}`, 'good')
      }
    }
  }

  if (ready) {
    next.screen = 'promotion'
    pushLog(next, 'Promotion ready. Mentor review unlocked.', 'good')
    return next
  }

  // early promotion via milestones: 3 of 5
  const hits = GRADES[next.grade].milestones.filter((m) => next.milestonesHit.includes(m.id)).length
  if (hits >= 3 && next.consecutiveGate >= 1 && next.crises.length === 0 && next.reviewsDone >= 2) {
    next.screen = 'promotion'
    pushLog(next, 'Milestone route: early promotion review.', 'good')
    return next
  }

  next.screen = 'cards'
  pushLog(next, 'Set your loadout for the next six months.', 'neutral')
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

  next.grade = nextId
  next.monthInGrade = 1
  next.paths = emptyPaths()
  next.neglect = emptyPaths()
  next.consecutiveGate = 0
  next.milestonesHit = []
  next.crises = []
  next.celebrationSlots = 1
  next.celebrationExpires = next.turn + 6
  next.projects = demoProjects(nextId)

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
    return next
  }
  const choice = ev.choices.find((c) => c.id === choiceId) ?? ev.choices[0]
  const burnout = next.burnoutTurns > 0
  for (const [k, v] of Object.entries(choice.effects)) {
    if (k === 'hours') next.resources.hours = Math.max(0, next.resources.hours + (v as number))
    else if (k in next.resources)
      applyResource(next.resources, k as keyof Resources, v as number, burnout)
  }
  pushLog(next, `Event: ${ev.title} — ${choice.result}`, 'neutral')
  next.pendingEvent = null
  next.screen = 'desk'
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
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as GameState
  } catch {
    return null
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(STORAGE_KEY)
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
