import { GRADES } from '../data/grades'
import {
  expectedLevel,
  levelFromEvidence,
  nextGradeId,
} from '../data/expectations'
import { milestonesFor } from '../data/milestones'
import type {
  ActionDef,
  GameState,
  GradeId,
  GridCell,
  PathId,
  Rating,
  SkillId,
  StageId,
} from '../data/types'

const SOFT: SkillId[] = ['communication', 'presenting', 'coordination', 'commercial']

export function monthInCycle(state: GameState): number {
  return ((state.monthInGrade - 1) % 6) + 1
}

export function applyMilestoneProgress(state: GameState, actionId: string) {
  const specs = milestonesFor(state.grade)
  for (const spec of specs) {
    if (!spec.actions.includes(actionId)) continue
    if (state.milestonesHit.includes(spec.id)) continue
    const add = spec.perAction ?? 1
    state.milestoneProgress[spec.id] = (state.milestoneProgress[spec.id] ?? 0) + add
    if (state.milestoneProgress[spec.id] >= spec.target) {
      state.milestonesHit.push(spec.id)
      state.log = [
        {
          turn: state.turn,
          text: `Milestone complete: ${spec.label}`,
          tone: 'good' as const,
        },
        ...state.log,
      ].slice(0, 40)
    }
  }
}

export function rateCard(
  state: GameState,
  cardId: string,
  path: PathId | 'crisis' | string,
  kind: string,
): Rating {
  const counts = state.actionsThisReview.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1
    return acc
  }, {})

  let score = 0
  if (path === 'technical' || kind === 'specialism') {
    score +=
      (counts['calc-package'] ?? 0) +
      (counts['model-layouts'] ?? 0) +
      (counts['automate'] ?? 0) +
      (counts['cpd-friday'] ?? 0) +
      (counts['chartership-log'] ?? 0)
  }
  if (path === 'delivery') {
    score +=
      (counts['drawing-set'] ?? 0) + (counts['timesheets'] ?? 0) + (counts['design-review'] ?? 0)
  }
  if (path === 'collaboration' || kind === 'cross') {
    score +=
      (counts['work-across'] ?? 0) +
      (counts['client-meeting'] ?? 0) +
      (counts['clash-cycle'] ?? 0) +
      (counts['lunch-learn'] ?? 0) +
      (counts['site-visit'] ?? 0)
  }
  if (path === 'leadership') {
    score +=
      (counts['ask-mentor'] ?? 0) +
      (counts['mentor-junior'] ?? 0) +
      (counts['cpd-friday'] ?? 0) +
      (counts['ask-feedback'] ?? 0) +
      (counts['chartership-log'] ?? 0)
  }
  if (cardId === 'seek-the-elders') score += (counts['ask-mentor'] ?? 0) + (counts['ask-feedback'] ?? 0)
  if (cardId === 'open-workshop') score += (counts['work-across'] ?? 0)
  if (cardId === 'field-notes') score += (counts['site-visit'] ?? 0)

  // Spread: distinct months in the 6-month cycle that saw a qualifying action
  const months = new Set<number>()
  for (const [id, list] of Object.entries(state.actionMonthsThisReview)) {
    if ((counts[id] ?? 0) > 0) list.forEach((m) => months.add(m))
  }
  const spread = months.size

  if (score < 2) return 'notShown'
  if (score <= 5) return 'emerging'
  if (spread < 4) return 'emerging'
  // Consistent: 6+ actions across ≥4 months
  if (!state.positiveFeedbackThisReview) return 'consistent'
  return 'roleModel'
}

/** Cap Role model to one card at Graduate / Technician. */
export function enforceRoleModelCap(
  grade: GradeId,
  ratings: Record<string, Rating>,
): Record<string, Rating> {
  if (grade !== 'graduate' && grade !== 'technician') return ratings
  let kept = false
  const out = { ...ratings }
  for (const id of Object.keys(out)) {
    if (out[id] !== 'roleModel') continue
    if (!kept) {
      kept = true
      continue
    }
    out[id] = 'consistent'
  }
  return out
}

export function gainGridEvidence(
  state: GameState,
  action: ActionDef,
  projectStage: StageId,
) {
  const skills = action.skills?.length
    ? action.skills
    : action.effects.skill
      ? [action.effects.skill]
      : []
  if (!skills.length) return

  const grade = state.grade
  const impact = GRADES[grade]?.impact?.[projectStage]
  const half = impact !== 'high' && impact !== 'medium'

  for (const skill of skills) {
    // Site visits always hit construction stage
    const stage: StageId =
      action.id === 'site-visit' ? 'construction' : projectStage
    const cell = state.grid.find((c) => c.skill === skill && c.stage === stage)
    if (!cell) continue

    let add = half ? 0.5 : 1
    // Concept cells for graduates only via CPD / charter / shadow-like actions
    if (
      stage === 'concept' &&
      (grade === 'graduate' || grade === 'technician') &&
      !['cpd-friday', 'chartership-log', 'lunch-learn'].includes(action.id)
    ) {
      add = 0
    }
    if (add <= 0) continue

    cell.evidence = Math.round((cell.evidence + add) * 10) / 10
    let nextLevel = levelFromEvidence(cell.evidence)

    // Levels above 2 need confirmation
    if (nextLevel >= 3 && !cell.confirmed) nextLevel = Math.min(2, nextLevel)

    // Cap: next grade expected + 1
    const nxt = nextGradeId(grade)
    const cap = nxt
      ? expectedLevel(nxt, skill, stage) + 1
      : expectedLevel(grade, skill, stage) + 1
    nextLevel = Math.min(nextLevel, Math.max(cap, 2))

    if (nextLevel > cell.level) cell.level = nextLevel
    if (!cell.revealed) cell.selfRating = Math.max(cell.selfRating, cell.level + (SOFT.includes(skill) ? 1 : 0))
  }
}

export function revealPriorityCell(state: GameState): GridCell | null {
  const hidden = state.grid.filter((c) => !c.revealed)
  if (!hidden.length) return null
  // Prefer soft skills with largest self vs actual gap / impact band
  const grade = state.grade
  const projectStage = state.projects[0]?.stage ?? 'detailed'
  hidden.sort((a, b) => {
    const score = (c: GridCell) => {
      const exp = expectedLevel(grade, c.skill, c.stage)
      const gap = Math.max(0, exp - c.level)
      const band = GRADES[grade]?.impact?.[c.stage] === 'high' ? 1 : 0
      const soft = SOFT.includes(c.skill) ? 1 : 0
      const focus = c.stage === projectStage ? 1 : 0
      return gap * 2 + band + soft + focus
    }
    return score(b) - score(a)
  })
  const cell = hidden[0]
  cell.revealed = true
  // Feedback may be lower than self-rating
  if (cell.selfRating > cell.level && Math.random() < 0.45) {
    cell.level = Math.max(0, cell.selfRating - 1)
  } else {
    cell.level = Math.max(cell.level, Math.min(5, cell.selfRating))
  }
  cell.confirmed = true
  return cell
}

export interface GapItem {
  skill: SkillId
  stage: StageId
  level: number
  expected: number
  score: number
  actionHint: string
  cardHint?: string
  path: PathId
}

export function topGaps(state: GameState, n = 3): GapItem[] {
  const grade = state.grade
  const paths = state.paths
  const weakest = (Object.entries(paths) as [PathId, number][]).sort((a, b) => a[1] - b[1])[0]?.[0]

  const skillToPath: Record<SkillId, PathId> = {
    technical: 'technical',
    communication: 'collaboration',
    presenting: 'collaboration',
    coordination: 'collaboration',
    commercial: 'delivery',
  }
  const actionHint: Record<SkillId, string> = {
    technical: 'Own a calc package ×3 (or Model layouts)',
    communication: 'Issue drawings ×2 · Lunch & Learn ×1',
    presenting: 'Sit a design review ×2 · Client meeting ×1',
    coordination: 'Work Across ×3 while the set is live',
    commercial: 'Close timesheets ×2',
  }
  const cardHint: Partial<Record<SkillId, string>> = {
    technical: "Kirchhoff's Apprentice / Field Notes",
    coordination: 'Open Workshop',
    presenting: 'Seek the Elders (after feedback)',
  }

  const gaps: GapItem[] = []
  for (const cell of state.grid) {
    if (!cell.revealed) continue
    const exp = expectedLevel(grade, cell.skill, cell.stage)
    if (cell.level >= exp) continue
    const band = GRADES[grade]?.impact?.[cell.stage] === 'high' ? 1 : 0
    const feedsWeak = skillToPath[cell.skill] === weakest ? 1 : 0
    const score = (exp - cell.level) * 2 + band + feedsWeak
    gaps.push({
      skill: cell.skill,
      stage: cell.stage,
      level: cell.level,
      expected: exp,
      score,
      actionHint: actionHint[cell.skill],
      cardHint: cardHint[cell.skill],
      path: skillToPath[cell.skill],
    })
  }
  return gaps.sort((a, b) => b.score - a.score).slice(0, n)
}

export function promotionReady(state: GameState): {
  ready: boolean
  reason: string
  earlyOk: boolean
  earlyMissing: string
  minMonths: number
} {
  const gate = state.consecutiveGate
  const growthNeed = growthNeedFor(state.grade)
  const hits = state.milestonesHit.length
  const crisis = state.crises.length > 0
  const growthOk = state.growthBanked >= growthNeed
  const gateOk = gate >= 2
  const ready = gateOk && growthOk && !crisis

  // Early promotion is rare: ≥12 months, 3 milestones, one passed gate, and Growth underway.
  // Graduate base timer is ~30 months — month 4 should never look “almost there.”
  const minMonths =
    state.grade === 'graduate' || state.grade === 'technician'
      ? 12
      : state.grade === 'engineer' || state.grade === 'seniorTechnician'
        ? 18
        : 24
  const growthFloor = Math.ceil(growthNeed * 0.4)

  let reason = ''
  if (ready) reason = 'Gate met twice, Growth banked, no Crisis.'
  else if (state.reviewsDone === 0) {
    reason = `First Review is at month 6 — path totals stay 0 until then (month ${state.monthInGrade} of the grade). Early promotion needs month ${minMonths}+ plus milestones and a passed gate.`
  } else if (gate < 2)
    reason = `Gate met at ${gate} of 2 reviews in a row.${weakestFloorNote(state)}`
  else if (!growthOk) reason = `Growth banked ${Math.round(state.growthBanked)} / ${growthNeed}.`
  else if (crisis) reason = 'Clear the Crisis before requesting promotion.'

  const earlyOk =
    hits >= 3 &&
    gate >= 1 &&
    state.monthInGrade >= minMonths &&
    state.growthBanked >= growthFloor &&
    !crisis
  let earlyMissing = ''
  if (hits < 3) earlyMissing = `needs ${3 - hits} more milestone(s)`
  else if (state.monthInGrade < minMonths)
    earlyMissing = `needs month ${minMonths}+ in grade (now ${state.monthInGrade})`
  else if (gate < 1) earlyMissing = 'needs a passed gate at Review'
  else if (state.growthBanked < growthFloor) earlyMissing = `needs Growth ≥ ${growthFloor}`
  else if (crisis) earlyMissing = 'clear Crisis first'

  return { ready, reason, earlyOk, earlyMissing, minMonths }
}

export function growthNeedFor(grade: GradeId): number {
  const table: Record<string, number> = {
    graduate: 20,
    technician: 20,
    engineer: 28,
    seniorTechnician: 28,
    senior: 36,
    bimLead: 36,
    associate: 48,
    leadCoordinator: 48,
  }
  return table[grade] ?? 20
}

function weakestFloorNote(state: GameState): string {
  const cfgM1 = state.grade === 'graduate' || state.grade === 'technician' ? 1 : 2
  const weak = (Object.entries(state.paths) as [PathId, number][])
    .filter(([, v]) => v < cfgM1 + 1)
    .sort((a, b) => a[1] - b[1])[0]
  if (!weak) return ''
  const need = cfgM1
  if (weak[1] >= need) return ` ${capitalize(weak[0])} is one point from a stronger mark.`
  return ` ${capitalize(weak[0])} is at risk of the floor.`
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function defaultTies(discipline: string) {
  return [
    { id: 'senior', name: 'Your Senior', role: 'Mentor', strength: 1 },
    { id: 'mech', name: 'Rohan', role: 'Mechanical', strength: discipline === 'mechanical' ? 2 : 0 },
    { id: 'arch', name: 'Maya', role: 'Architect', strength: discipline === 'architect' ? 2 : 0 },
    { id: 'tech', name: 'Sam', role: 'Technician', strength: 0 },
    { id: 'pm', name: 'Project Manager', role: 'Client-side PM', strength: 0 },
    { id: 'peer', name: 'Peer Engineer', role: 'Same grade', strength: 1 },
  ]
}
