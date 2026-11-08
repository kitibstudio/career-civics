import { CARD_BY_ID } from '../data/cards'
import { GRADES, PATH_LABELS } from '../data/grades'
import type { GameState, GradeId } from '../data/types'
import { growthNeedFor } from './progress'

/** Minimum months in grade before *any* promotion (normal or early). */
export function minMonthsForGrade(grade: GradeId, early: boolean): number {
  if (early) {
    // Early is exceptional — Grad/Tech no longer hop at month 12 by default
    if (grade === 'graduate') return 15
    if (grade === 'technician') return 18
    if (grade === 'engineer' || grade === 'seniorTechnician') return 18
    return 24
  }
  // Normal gate path — aligned to ~half of design Age timers
  if (grade === 'graduate') return 18
  if (grade === 'technician') return 24
  if (grade === 'engineer' || grade === 'seniorTechnician') return 24
  if (grade === 'senior' || grade === 'bimLead') return 30
  return 24
}

export function needsCharterGate(grade: GradeId): boolean {
  return grade === 'engineer' || grade === 'seniorTechnician'
}

/**
 * Blind-spot milestones that early promotion must include so strengths
 * cannot skip the character lesson (Aisha/site, Rohan/calcs, Sam/Revit+site|QA).
 */
export function earlyBlindSpotMissing(state: GameState): string | null {
  const hits = new Set(state.milestonesHit)
  if (state.grade === 'graduate') {
    const missing: string[] = []
    if (!hits.has('calcPackage')) missing.push('Own a calc package')
    if (!hits.has('siteVisits')) missing.push('Log site visits')
    if (missing.length) return missing.join(' + ')
    return null
  }
  if (state.grade === 'technician') {
    if (!hits.has('secondPackage')) return 'Learn Revit (second package)'
    if (!hits.has('siteVisits') && !hits.has('drawingQa')) {
      return 'Site visits or drawing QA'
    }
    return null
  }
  return null
}

export interface PromotionBlocker {
  id: string
  label: string
  detail: string
  fix?: string
}

export function promotionBlockers(state: GameState): PromotionBlocker[] {
  const blockers: PromotionBlocker[] = []
  const growthNeed = growthNeedFor(state.grade)
  const minNormal = minMonthsForGrade(state.grade, false)
  const minEarly = minMonthsForGrade(state.grade, true)
  const hits = state.milestonesHit.length
  const crisis = state.crises.length > 0
  const earlyBlind = earlyBlindSpotMissing(state)

  if (state.reviewsDone === 0) {
    blockers.push({
      id: 'first-review',
      label: 'Awaiting first Review',
      detail: `Path scores land at month 6 (now month ${state.monthInGrade}).`,
    })
  }

  if (crisis) {
    for (const id of state.crises) {
      const card = CARD_BY_ID[id]
      const clearer = card?.clearedBy ? CARD_BY_ID[card.clearedBy] : null
      blockers.push({
        id: `crisis-${id}`,
        label: `Crisis: ${card?.name ?? id}`,
        detail: card?.practice ?? 'Clear this crisis before promotion.',
        fix: clearer
          ? `Slot “${clearer.name}” on Cards and earn Emerging+ at the next Review.`
          : 'Clear the crisis from your loadout after a clean Review.',
      })
    }
  }

  // Tenure only blocks the *normal* route; omit when early is otherwise open
  // (callers filter further when earlyOk)
  if (state.monthInGrade < minNormal) {
    blockers.push({
      id: 'tenure',
      label: `Tenure · need month ${minNormal}+`,
      detail: `You are month ${state.monthInGrade} of this grade. Normal promotion waits for tenure (early route: month ${minEarly}+ with role milestones).`,
    })
  }

  if (state.consecutiveGate < 2) {
    blockers.push({
      id: 'gate',
      label: `Gate streak ${state.consecutiveGate}/2`,
      detail: 'Pass the path gate at two Reviews in a row (every path at M1, enough at M2).',
    })
  }

  if (state.growthBanked < growthNeed) {
    blockers.push({
      id: 'growth',
      label: `Growth ${Math.round(state.growthBanked)} / ${growthNeed}`,
      detail: 'Bank Growth via CPD, slotted habits, and strong path marks at Review.',
    })
  }

  if (needsCharterGate(state.grade) && !state.professionalReview.passed) {
    blockers.push({
      id: 'charter-pr',
      label: 'Professional Review not passed',
      detail:
        'Engineer → Senior (and Senior Tech → BIM Lead) needs a passed Professional Review on Self once UK-SPEC elements are demonstrated.',
      fix: 'Build evidence to ≥ demonstrated on all 17 elements, then Sit Professional Review.',
    })
  }

  if (state.lastReview?.moralePenalty) {
    blockers.push({
      id: 'morale',
      label: 'Morale penalty last Review',
      detail: 'Team Happiness failed — clear the morale hit before promoting.',
    })
  }

  if (hits < 3) {
    blockers.push({
      id: 'milestones-early',
      label: `Early route · milestones ${hits}/3`,
      detail: 'Early promotion also needs 3 grade milestones.',
    })
  }

  if (earlyBlind) {
    blockers.push({
      id: 'blind-spot-early',
      label: 'Early route · blind-spot milestones',
      detail: `Early promotion also needs: ${earlyBlind}.`,
      fix: 'Close the milestones that match your character blind spot before requesting early.',
    })
  }

  return blockers
}

export function canPromoteNormal(state: GameState): boolean {
  const growthNeed = growthNeedFor(state.grade)
  const minNormal = minMonthsForGrade(state.grade, false)
  if (state.crises.length > 0) return false
  if (state.monthInGrade < minNormal) return false
  if (state.consecutiveGate < 2) return false
  if (state.growthBanked < growthNeed) return false
  if (state.lastReview?.moralePenalty) return false
  if (needsCharterGate(state.grade) && !state.professionalReview.passed) return false
  return true
}

export function canPromoteEarly(state: GameState): boolean {
  const growthNeed = growthNeedFor(state.grade)
  const minEarly = minMonthsForGrade(state.grade, true)
  const growthFloor = Math.ceil(growthNeed * 0.5)
  if (state.crises.length > 0) return false
  if (state.monthInGrade < minEarly) return false
  if (state.consecutiveGate < 1) return false
  if (state.milestonesHit.length < 3) return false
  if (earlyBlindSpotMissing(state)) return false
  if (state.growthBanked < growthFloor) return false
  if (needsCharterGate(state.grade) && !state.professionalReview.passed) return false
  // Early still needs Technical or Delivery at least at M1 so soft-skill-only climbs slow down
  const cfgM1 = state.grade === 'graduate' || state.grade === 'technician' ? 1 : 2
  if ((state.paths.technical ?? 0) < cfgM1 && (state.paths.delivery ?? 0) < cfgM1) return false
  return true
}

export function promotionReady(state: GameState): {
  ready: boolean
  reason: string
  earlyOk: boolean
  earlyMissing: string
  minMonths: number
  minMonthsEarly: number
  blockers: PromotionBlocker[]
} {
  const blockers = promotionBlockers(state)
  const ready = canPromoteNormal(state)
  const earlyOk = canPromoteEarly(state)
  const minMonths = minMonthsForGrade(state.grade, false)
  const grade = GRADES[state.grade]

  let reason = ''
  if (ready) reason = `Ready for ${grade.next ? GRADES[grade.next].name : 'Legacy'} — tenure, gate, Growth, no Crisis.`
  else if (earlyOk)
    reason = `Early route open (month ${minMonthsForGrade(state.grade, true)}+ bar met). Request it on Self — it no longer auto-fires after Review.`
  else {
    const top = blockers.find((b) => b.id.startsWith('crisis-')) ?? blockers[0]
    reason = top
      ? `${top.label}. ${top.fix ?? top.detail}`
      : 'Not yet ready.'
  }

  let earlyMissing = ''
  if (!earlyOk) {
    const crisis = blockers.find((b) => b.id.startsWith('crisis-'))
    const blind = earlyBlindSpotMissing(state)
    if (crisis) earlyMissing = crisis.fix ?? 'clear Crisis first'
    else if (state.monthInGrade < minMonthsForGrade(state.grade, true))
      earlyMissing = `needs month ${minMonthsForGrade(state.grade, true)}+ (now ${state.monthInGrade})`
    else if (state.milestonesHit.length < 3)
      earlyMissing = `needs ${3 - state.milestonesHit.length} more milestone(s)`
    else if (blind) earlyMissing = `needs ${blind}`
    else if (state.consecutiveGate < 1) earlyMissing = 'needs a passed gate at Review'
    else if (needsCharterGate(state.grade) && !state.professionalReview.passed)
      earlyMissing = 'needs Professional Review pass'
    else if ((state.paths.technical ?? 0) < 1 && (state.paths.delivery ?? 0) < 1)
      earlyMissing = 'needs Technical or Delivery at M1'
    else earlyMissing = 'not yet'
  }

  return {
    ready,
    reason,
    earlyOk,
    earlyMissing,
    minMonths,
    minMonthsEarly: minMonthsForGrade(state.grade, true),
    blockers,
  }
}

export function crisisClearHint(state: GameState): string | null {
  if (!state.crises.length) return null
  const parts = state.crises.map((id) => {
    const card = CARD_BY_ID[id]
    const clearer = card?.clearedBy ? CARD_BY_ID[card.clearedBy] : null
    return clearer
      ? `${card?.name}: slot ${clearer.name}`
      : card?.name ?? id
  })
  return `Crisis lock — ${parts.join('; ')}. Promotion stays closed until cleared.`
}

export { PATH_LABELS }
