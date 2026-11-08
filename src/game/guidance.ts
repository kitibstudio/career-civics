import { CARD_BY_ID } from '../data/cards'
import { GRADES, PATH_LABELS, PATH_ORDER, gateConfig } from '../data/grades'
import type { GameState, PathId } from '../data/types'
import {
  availableCards,
  cardScoringPath,
  commitmentRequired,
  monthActions,
  projectReview,
  slotCount,
  type ReviewProjection,
} from './engine'
import { growthNeedFor } from './progress'
import { minMonthsForGrade, needsCharterGate, promotionReady } from './promotion'

const SUGGESTED_ACTIONS: Record<PathId, string[]> = {
  delivery: ['drawing-set', 'design-review', 'timesheets'],
  technical: ['calc-package', 'model-layouts', 'cpd-friday'],
  collaboration: ['work-across', 'site-visit', 'client-meeting', 'clash-cycle'],
  leadership: ['ask-mentor', 'peer-check', 'mentor-junior'],
  commitment: ['risk-review', 'chartership-log', 'carbon-option'],
}

export interface Requirement {
  id: string
  label: string
  done: boolean
  detail: string
}

export interface FocusItem {
  id: string
  tone: 'bad' | 'warn' | 'info'
  title: string
  detail: string
}

export function gateCountsPath(state: GameState, p: PathId): boolean {
  if (state.specialistWaive === p) return false
  return p !== 'commitment' || commitmentRequired(state.grade)
}

export function emptySlots(state: GameState): { used: number; max: number; empty: number } {
  const max = slotCount(state)
  const used = state.slotted.length
  return { used, max, empty: Math.max(0, max - used) }
}

function actionNames(state: GameState, p: PathId, n = 2): string {
  const available = monthActions(state)
  return SUGGESTED_ACTIONS[p]
    .map((id) => available.find((a) => a.id === id)?.name)
    .filter(Boolean)
    .slice(0, n)
    .join(' / ')
}

function cardFor(state: GameState, p: PathId): string | null {
  const card = availableCards(state).find(
    (c) => c.kind !== 'crisis' && !state.slotted.includes(c.id) && cardScoringPath(c) === p,
  )
  return card?.name ?? null
}

function hasCardOn(state: GameState, p: PathId): boolean {
  return state.slotted.some((id) => {
    const card = CARD_BY_ID[id]
    return card ? cardScoringPath(card) === p : false
  })
}

/** Normal-route promotion requirements, each ticked or not. */
export function promotionRequirements(state: GameState): Requirement[] {
  const minNormal = minMonthsForGrade(state.grade, false)
  const growthNeed = growthNeedFor(state.grade)
  const reqs: Requirement[] = [
    {
      id: 'tenure',
      label: `Time in grade · month ${Math.min(state.monthInGrade, minNormal)}/${minNormal}`,
      done: state.monthInGrade >= minNormal,
      detail:
        state.monthInGrade >= minNormal
          ? 'Tenure met.'
          : `${minNormal - state.monthInGrade} more month(s) — tenure can’t be rushed.`,
    },
    {
      id: 'gate',
      label: `Gate passed 2 Reviews running · ${Math.min(state.consecutiveGate, 2)}/2`,
      done: state.consecutiveGate >= 2,
      detail: 'Every path at M1 and at least one at M2 at Review.',
    },
    {
      id: 'growth',
      label: `Growth · ${Math.round(state.growthBanked)}/${growthNeed}`,
      done: state.growthBanked >= growthNeed,
      detail:
        state.growthBanked >= growthNeed
          ? 'Growth met.'
          : `${Math.ceil(growthNeed - state.growthBanked)} more — CPD, chartership log and strong paths bank Growth at Review.`,
    },
    {
      id: 'crisis',
      label: state.crises.length ? `Clear crisis (${state.crises.length})` : 'No crisis in play',
      done: state.crises.length === 0,
      detail: state.crises.length
        ? state.crises
            .map((id) => {
              const c = CARD_BY_ID[id]
              const clearer = c?.clearedBy ? CARD_BY_ID[c.clearedBy]?.name : null
              return clearer ? `${c?.name}: slot ${clearer}` : c?.name ?? id
            })
            .join('; ')
        : 'Crises block promotion until cleared.',
    },
  ]
  if (needsCharterGate(state.grade)) {
    reqs.push({
      id: 'pr',
      label: 'Professional Review passed',
      done: state.professionalReview.passed,
      detail: 'Engineer → Senior needs chartership: all 17 UK-SPEC elements demonstrated, then sit it on Self.',
    })
  }
  if (state.lastReview?.moralePenalty) {
    reqs.push({
      id: 'morale',
      label: 'No morale penalty',
      done: false,
      detail: 'Last Review failed the team morale check.',
    })
  }
  return reqs
}

/** Short, ordered "do this next" list from live cycle evidence. */
export function focusItems(state: GameState, projection?: ReviewProjection): FocusItem[] {
  const proj = projection ?? projectReview(state)
  const cfg = gateConfig(state.grade)
  const items: FocusItem[] = []
  const slots = emptySlots(state)
  const reviewIn = `${proj.monthsToReview} month${proj.monthsToReview === 1 ? '' : 's'}`

  for (const id of state.crises) {
    const c = CARD_BY_ID[id]
    const clearer = c?.clearedBy ? CARD_BY_ID[c.clearedBy] : null
    items.push({
      id: `crisis-${id}`,
      tone: 'bad',
      title: `Clear ${c?.name ?? id}`,
      detail: clearer
        ? `Keep “${clearer.name}” slotted and earn Emerging+ at Review. Promotion is locked until then.`
        : 'Promotion is locked until this clears.',
    })
  }

  if (slots.empty > 0) {
    items.push({
      id: 'slots',
      tone: 'warn',
      title: `${slots.empty} of ${slots.max} card slot${slots.max === 1 ? '' : 's'} empty`,
      detail: 'Desk actions only score path points through a slotted card on that path. Fill slots on Cards.',
    })
  }

  for (const p of PATH_ORDER) {
    if (!gateCountsPath(state, p)) continue
    const projected = proj.totals[p]
    if (projected >= cfg.m1) continue
    const idle = proj.breakdown.idleBlocks
    const causes: string[] = []
    if (p === 'delivery' && idle > 0) causes.push(`Unutilized ×${idle} is costing −${idle}`)
    const card = hasCardOn(state, p) ? null : cardFor(state, p)
    if (!hasCardOn(state, p) && p !== 'commitment')
      causes.push(card ? `slot a ${PATH_LABELS[p]} card (e.g. ${card})` : `no ${PATH_LABELS[p]} card slotted`)
    const acts = actionNames(state, p)
    if (acts) causes.push(`do ${acts}`)
    items.push({
      id: `low-${p}`,
      tone: 'bad',
      title: `${PATH_LABELS[p]} heading for ${fmtNum(projected)} — needs ${cfg.m1} for M1`,
      detail: `${causes.join('; ')}. Review in ${reviewIn}.`,
    })
  }

  const strong = PATH_ORDER.filter((p) => gateCountsPath(state, p) && proj.totals[p] >= cfg.m2).length
  if (strong < cfg.gateStrong) {
    const best = PATH_ORDER.filter((p) => gateCountsPath(state, p)).sort(
      (a, b) => proj.totals[b] - proj.totals[a],
    )[0]
    if (best) {
      items.push({
        id: 'm2',
        tone: 'warn',
        title: `Push ${PATH_LABELS[best]} to M2 (${cfg.m2}) — heading for ${fmtNum(proj.totals[best])}`,
        detail: `The gate needs ${cfg.gateStrong} strong path${cfg.gateStrong === 1 ? '' : 's'}. Spread ${actionNames(state, best) || 'its actions'} across months so its card rates Consistent.`,
      })
    }
  }

  for (const p of PATH_ORDER) {
    const risk = proj.breakdown.neglect[p]
    if (!risk.consequence) continue
    const what =
      risk.consequence.kind === 'drift'
        ? `Drift (−2 ${PATH_LABELS[p]})`
        : `the ${CARD_BY_ID[risk.consequence.crisisId]?.name ?? 'crisis'} crisis`
    const fix =
      p === 'commitment'
        ? `log ${actionNames(state, p)}`
        : `slot a ${PATH_LABELS[p]} card${cardFor(state, p) ? ` (e.g. ${cardFor(state, p)})` : ''}`
    items.push({
      id: `neglect-${p}`,
      tone: 'warn',
      title: `${PATH_LABELS[p]} unfed ${risk.streakAfter} Reviews running — ${what} at next Review`,
      detail: `To avoid it, ${fix}.`,
    })
  }

  const growthNeed = growthNeedFor(state.grade)
  if (state.growthBanked < growthNeed) {
    const short = Math.ceil(growthNeed - state.growthBanked)
    items.push({
      id: 'growth',
      tone: 'info',
      title: `Growth ${Math.round(state.growthBanked)}/${growthNeed} — ${short} to go`,
      detail: 'Up to +5 per Review: CPD Friday / chartership log blocks, Growth habits, and paths at M2+.',
    })
  }

  const ready = promotionReady(state)
  const minNormal = minMonthsForGrade(state.grade, false)
  if (!ready.ready && state.monthInGrade < minNormal && GRADES[state.grade]?.next) {
    items.push({
      id: 'tenure',
      tone: 'info',
      title: `Tenure: month ${state.monthInGrade} of ${minNormal}`,
      detail: `Normal promotion opens at month ${minNormal}; early route from month ${ready.minMonthsEarly} with 3 milestones. Use the time to bank gate passes.`,
    })
  }

  return items
}

export function fmtSigned(n: number): string {
  if (n > 0) return `+${n}`
  if (n < 0) return `−${Math.abs(n)}`
  return '0'
}

export function fmtNum(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : `${n}`
}
