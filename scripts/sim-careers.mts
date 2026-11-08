/**
 * Headless 24-month career sims for each starting character.
 * Run: npx --yes tsx scripts/sim-careers.mts
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { CHARACTERS } from '../src/data/characters.ts'
import { GRADES, PATH_LABELS, gateConfig } from '../src/data/grades.ts'
import { INBOX_POOL } from '../src/data/inbox.ts'
import { EVENTS } from '../src/data/actions.ts'
import { habitsForGrade, CARD_BY_ID } from '../src/data/cards.ts'
import {
  continueAfterPromotion,
  createNewGame,
  endMonth,
  finishReview,
  monthActions,
  performAction,
  promote,
  resolveEventChoice,
  resolveEventClaim,
  resolveInbox,
  toggleCard,
} from '../src/game/engine.ts'
import type { GameState, PathId } from '../src/data/types.ts'

/** Deterministic PRNG so runs are comparable. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type PersonaId = 'aisha' | 'rohan' | 'maya' | 'sam'

const PERSONA_WEIGHTS: Record<
  PersonaId,
  { id: string; w: number }[]
> = {
  aisha: [
    { id: 'calc-package', w: 5 },
    { id: 'drawing-set', w: 2 },
    { id: 'design-review', w: 2 },
    { id: 'cpd-friday', w: 1.5 },
    { id: 'chartership-log', w: 1 },
    { id: 'risk-review', w: 1 },
    { id: 'requirements-brief', w: 1 },
    { id: 'work-across', w: 1 },
    { id: 'ask-mentor', w: 0.4 }, // blind spot: rarely asks
    { id: 'site-visit', w: 0.5 },
    { id: 'timesheets', w: 1 },
    { id: 'lunch-learn', w: 0.5 },
    { id: 'leave', w: 0.4 },
    { id: 'conduct-dilemma', w: 0.5 },
    { id: 'automate', w: 0.8 },
  ],
  rohan: [
    { id: 'site-visit', w: 4 },
    { id: 'drawing-set', w: 3 },
    { id: 'work-across', w: 2.5 },
    { id: 'calc-package', w: 1.2 }, // rushes calcs
    { id: 'design-review', w: 1.5 },
    { id: 'ask-mentor', w: 1.5 },
    { id: 'client-meeting', w: 1 },
    { id: 'cpd-friday', w: 1 },
    { id: 'chartership-log', w: 0.8 },
    { id: 'risk-review', w: 1 },
    { id: 'lunch-learn', w: 1 },
    { id: 'timesheets', w: 1 },
    { id: 'leave', w: 0.5 },
    { id: 'carbon-option', w: 0.6 },
  ],
  maya: [
    { id: 'client-meeting', w: 3.5 },
    { id: 'lunch-learn', w: 3 },
    { id: 'design-review', w: 2.5 },
    { id: 'work-across', w: 2 },
    { id: 'ask-mentor', w: 2 },
    { id: 'drawing-set', w: 1.5 },
    { id: 'calc-package', w: 1 },
    { id: 'site-visit', w: 1 },
    { id: 'cpd-friday', w: 1.2 },
    { id: 'chartership-log', w: 1 },
    { id: 'conduct-dilemma', w: 1 },
    { id: 'requirements-brief', w: 1.5 },
    { id: 'timesheets', w: 0.8 },
    { id: 'leave', w: 0.6 },
    { id: 'carbon-option', w: 0.8 },
  ],
  sam: [
    { id: 'model-layouts', w: 4 },
    { id: 'drawing-set', w: 3 },
    { id: 'clash-cycle', w: 2 },
    { id: 'learn-revit', w: 2 },
    { id: 'work-across', w: 2 },
    { id: 'ask-mentor', w: 1.5 },
    { id: 'cpd-friday', w: 1.2 },
    { id: 'chartership-log', w: 1 },
    { id: 'site-visit', w: 1 },
    { id: 'risk-review', w: 0.8 },
    { id: 'automate', w: 1.5 },
    { id: 'timesheets', w: 1 },
    { id: 'lunch-learn', w: 0.8 },
    { id: 'leave', w: 0.5 },
    { id: 'conduct-dilemma', w: 0.5 },
  ],
}

function pickWeighted(
  rng: () => number,
  available: string[],
  weights: { id: string; w: number }[],
): string | null {
  const pool = weights.filter((w) => available.includes(w.id))
  if (!pool.length) {
    if (!available.length) return null
    return available[Math.floor(rng() * available.length)]!
  }
  const total = pool.reduce((s, p) => s + p.w, 0)
  let r = rng() * total
  for (const p of pool) {
    r -= p.w
    if (r <= 0) return p.id
  }
  return pool[pool.length - 1]!.id
}

function snapshot(state: GameState) {
  const cfg = gateConfig(state.grade)
  const paths = Object.fromEntries(
    (Object.keys(PATH_LABELS) as PathId[]).map((p) => [
      p,
      {
        total: state.paths[p] ?? 0,
        m1: cfg.m1,
        m2: cfg.m2,
        mark:
          (state.paths[p] ?? 0) >= cfg.golden
            ? 'golden'
            : (state.paths[p] ?? 0) >= cfg.m2
              ? 'm2'
              : (state.paths[p] ?? 0) >= cfg.m1
                ? 'm1'
                : 'below',
      },
    ]),
  )
  return {
    turn: state.turn,
    grade: state.grade,
    monthInGrade: state.monthInGrade,
    screen: state.screen,
    paths,
    growthBanked: state.growthBanked,
    growthNeed: cfg.growthNeed,
    milestonesHit: [...state.milestonesHit],
    milestoneProgress: { ...state.milestoneProgress },
    crises: [...state.crises],
    consecutiveGate: state.consecutiveGate,
    reviewsDone: state.reviewsDone,
    wellbeing: state.resources.wellbeing,
    burnoutTurns: state.burnoutTurns,
    cpd: state.cpd.plannedHours + state.cpd.unplannedHours,
    charterEntries: state.charterLog.length,
    demonstratedElements: Object.values(state.elementStrength).filter(
      (s) => s === 'demonstrated' || s === 'strong',
    ).length,
    professionalReview: { ...state.professionalReview },
    ended: state.ended,
  }
}

function playMonth(state: GameState, persona: PersonaId, rng: () => number): GameState {
  let s = state
  // Inbox: prefer walk / good choices
  for (const item of [...s.inbox]) {
    if (item.resolved) continue
    const def = INBOX_POOL.find((d) => d.id === item.defId)
    if (!def) continue
    const choice =
      def.choices.find((c) => c.id === 'walk' || c.id === 'clarify' || c.id === 'meet') ??
      def.choices.find((c) => !c.risk) ??
      def.choices[0]
    if (!choice) continue
    if ((choice.hours ?? 0) > s.resources.hours) continue
    s = resolveInbox(s, item.defId, choice.id)
  }

  const weights = PERSONA_WEIGHTS[persona]
  let guard = 0
  while (s.screen === 'desk' && s.resources.hours >= 8 && guard < 30) {
    guard++
    const actions = monthActions(s).filter((a) => a.hours > 0 && a.hours <= s.resources.hours)
    // avoid overtime unless wellbeing healthy; leave if wellbeing low
    let ids = actions.map((a) => a.id).filter((id) => id !== 'unutilized')
    if (s.resources.wellbeing <= s.wellbeingFloor + 3) {
      ids = ids.filter((id) => id === 'leave' || id === 'ask-mentor' || id === 'cpd-friday')
      if (!ids.length) ids = ['leave']
    }
    if (s.resources.wellbeing > 10) {
      ids = ids.filter((id) => id !== 'leave')
    }
    // Don't spam learn-revit after unlocked
    if (s.software.revit) ids = ids.filter((id) => id !== 'learn-revit')
    const pick = pickWeighted(rng, ids, weights)
    if (!pick) {
      // burn remaining as unutilized intentionally rare
      if (s.resources.hours >= 8 && rng() < 0.15) s = performAction(s, 'unutilized')
      else break
      continue
    }
    s = performAction(s, pick)
  }
  // leftover hours: mostly spend, small chance unutilized
  while (s.screen === 'desk' && s.resources.hours >= 8) {
    if (rng() < 0.12) s = performAction(s, 'unutilized')
    else {
      const actions = monthActions(s).filter(
        (a) => a.hours === 8 && a.id !== 'unutilized' && a.id !== 'overtime',
      )
      const pick = pickWeighted(
        rng,
        actions.map((a) => a.id),
        weights,
      )
      if (!pick) break
      s = performAction(s, pick)
    }
  }

  if (s.screen === 'desk') s = endMonth(s)
  return s
}

function handleScreens(state: GameState, rng: () => number): GameState {
  let s = state
  let loops = 0
  while (loops++ < 20) {
    if (s.screen === 'event' && s.pendingEvent) {
      const ev = EVENTS.find((e) => e.id === s.pendingEvent)
      // Prefer constructive choices; avoid drawsCornerCut
      const safe =
        ev?.choices.filter((c) => !c.drawsCornerCut) ?? []
      const choice = safe[Math.floor(rng() * Math.max(1, safe.length))] ?? ev?.choices[0]
      if (!choice) {
        s = { ...s, screen: 'desk', pendingEvent: null }
        continue
      }
      s = resolveEventChoice(s, choice.id)
      if (s.pendingClaim) {
        const claim = rng() < 0.55 ? 'led' : rng() < 0.7 ? 'contributed' : 'we'
        s = resolveEventClaim(s, claim as 'led' | 'contributed' | 'we')
      }
      continue
    }
    if (s.screen === 'review') {
      s = finishReview(s)
      continue
    }
    if (s.screen === 'promotion') {
      if (s.justPromoted) {
        s = continueAfterPromotion(s)
        continue
      }
      const habits = habitsForGrade(s.grade).filter((h) => s.slotted.includes(h.id))
      s = promote(s, habits[0]?.id)
      continue
    }
    if (s.screen === 'cards') {
      // Ensure a balanced loadout: keep specialisms, fill habits for weak paths
      const max = GRADES[s.grade]?.slots ?? 2
      const available = habitsForGrade(s.grade)
      // Prefer habits covering delivery/technical/collaboration/leadership/commitment
      const want = ['delivery', 'technical', 'collaboration', 'leadership', 'commitment'] as PathId[]
      for (const path of want) {
        if (s.slotted.length >= max) break
        const card = available.find(
          (c) => c.path === path && !s.slotted.includes(c.id),
        )
        if (card) s = toggleCard(s, card.id)
      }
      while (s.slotted.filter((id) => !s.crises.includes(id)).length < max) {
        const card = available.find((c) => !s.slotted.includes(c.id))
        if (!card) break
        s = toggleCard(s, card.id)
      }
      s = { ...s, screen: 'desk' }
      continue
    }
    if (s.screen === 'charterReview') {
      s = { ...s, screen: 'desk' }
      continue
    }
    break
  }
  return s
}

function simulate(characterId: PersonaId, months = 24, seed = 42) {
  const rng = mulberry32(seed + characterId.split('').reduce((a, c) => a + c.charCodeAt(0), 0))
  const realRandom = Math.random
  Math.random = rng

  let state = createNewGame(characterId, { charterBody: 'cibse' })
  const timeline: ReturnType<typeof snapshot>[] = []
  const promotions: { turn: number; from: string; to: string }[] = []
  let prevGrade = state.grade
  const start = Date.now()

  for (let m = 0; m < months; m++) {
    if (state.ended) break
    state = handleScreens(state, rng)
    if (state.screen !== 'desk') {
      // stuck?
      timeline.push({ ...snapshot(state), note: 'stuck-screen' } as never)
      break
    }
    state = playMonth(state, characterId, rng)
    state = handleScreens(state, rng)
    if (state.grade !== prevGrade) {
      promotions.push({ turn: state.turn, from: prevGrade, to: state.grade })
      prevGrade = state.grade
    }
    if (m === 5 || m === 11 || m === 17 || m === 23 || state.ended) {
      timeline.push(snapshot(state))
    }
  }

  Math.random = realRandom
  const final = snapshot(state)
  const char = CHARACTERS.find((c) => c.id === characterId)!
  return {
    character: { id: char.id, name: char.name, route: char.route, track: char.track },
    monthsSimulated: Math.min(months, state.turn),
    elapsedMs: Date.now() - start,
    promotions,
    final,
    timeline,
    lastReview: state.lastReview
      ? {
          gatePass: state.lastReview.gatePass,
          pathDelta: state.lastReview.pathDelta,
          growthGained: state.lastReview.growthGained,
          notes: state.lastReview.notes.slice(0, 8),
        }
      : null,
  }
}

const results = (['aisha', 'rohan', 'maya', 'sam'] as PersonaId[]).map((id, i) =>
  simulate(id, 24, 1000 + i * 17),
)

mkdirSync('/tmp/career-sims', { recursive: true })
const outPath = '/tmp/career-sims/two-year-runs.json'
writeFileSync(outPath, JSON.stringify(results, null, 2))
console.log(JSON.stringify({ outPath, summary: results.map((r) => ({
  name: r.character.name,
  months: r.monthsSimulated,
  grade: r.final.grade,
  promotions: r.promotions,
  growth: `${r.final.growthBanked}/${r.final.growthNeed}`,
  milestones: r.final.milestonesHit.length,
  crises: r.final.crises,
  gateStreak: r.final.consecutiveGate,
  reviews: r.final.reviewsDone,
  cpd: r.final.cpd,
  demonstrated: r.final.demonstratedElements,
  pathMarks: Object.fromEntries(
    Object.entries(r.final.paths).map(([k, v]) => [k, `${(v as { total: number; mark: string }).total}:${(v as { mark: string }).mark}`]),
  ),
})) }, null, 2))
