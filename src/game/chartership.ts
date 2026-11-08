import {
  CPD_ANNUAL_TARGET,
  CPD_BLOCK_HOURS,
  claimToStrength,
  emptyEvidenceMap,
  elementsReadyForReview,
  maxStrength,
  weakestElements,
} from '../data/ukSpec'
import type {
  ActionDef,
  ClaimRole,
  GameState,
  UkSpecElementId,
} from '../data/types'

export function ensureChartership(state: GameState): void {
  if (!state.elementStrength) state.elementStrength = emptyEvidenceMap()
  if (!state.charterLog) state.charterLog = []
  if (!state.cpd) {
    state.cpd = { plannedHours: 0, unplannedHours: 0, yearStartTurn: 1 }
  }
  if (!state.professionalReview) {
    state.professionalReview = {
      attempted: false,
      passed: false,
      deferredElements: [],
      notes: [],
    }
  }
  if (!state.paths.commitment && state.paths.commitment !== 0) {
    state.paths.commitment = 0
  }
  if (!state.neglect.commitment && state.neglect.commitment !== 0) {
    state.neglect.commitment = 0
  }
  if (state.pendingClaim === undefined) state.pendingClaim = null
}

export function cpdProgress(state: GameState): {
  total: number
  target: number
  planned: number
  unplanned: number
  met: boolean
} {
  ensureChartership(state)
  const total = state.cpd.plannedHours + state.cpd.unplannedHours
  return {
    total,
    target: CPD_ANNUAL_TARGET,
    planned: state.cpd.plannedHours,
    unplanned: state.cpd.unplannedHours,
    met: total >= CPD_ANNUAL_TARGET,
  }
}

export function logEvidence(
  state: GameState,
  opts: {
    source: 'action' | 'event' | 'cpd' | 'review'
    title: string
    elements: UkSpecElementId[]
    claim: ClaimRole
    note?: string
  },
): void {
  ensureChartership(state)
  const credited = opts.claim !== 'we'
  const strength = credited ? claimToStrength(opts.claim) : 'mentioned'
  for (const el of opts.elements) {
    state.elementStrength[el] = maxStrength(state.elementStrength[el] ?? 'none', strength)
  }
  state.charterLog.unshift({
    id: `ev-${state.turn}-${state.charterLog.length}-${Math.random().toString(36).slice(2, 6)}`,
    turn: state.turn,
    source: opts.source,
    title: opts.title,
    elements: opts.elements,
    claim: opts.claim,
    credited,
    note: opts.note,
  })
  state.charterLog = state.charterLog.slice(0, 60)
  // Graduate charterLog milestone advances only via desk CPD/commitment blocks
  // (see milestones.ts) — evidence entries alone no longer auto-complete it.
}

export function applyActionChartership(state: GameState, action: ActionDef): void {
  ensureChartership(state)
  if (action.cpdHours) {
    state.cpd.plannedHours += action.cpdHours
  }
  if (action.elements?.length) {
    logEvidence(state, {
      source: action.cpdHours ? 'cpd' : 'action',
      title: action.name,
      elements: action.elements,
      claim: 'contributed',
      note: 'Desk action — claim upgraded if you led the work in a later event.',
    })
  }
  // Sponsor tie from Ask Up
  if (action.id === 'ask-mentor') {
    state.sponsor.tieStrength = Math.min(3, state.sponsor.tieStrength + 1)
  }
}

export function canAttemptProfessionalReview(state: GameState): boolean {
  ensureChartership(state)
  if (state.professionalReview.passed) return false
  if (!['engineer', 'senior', 'associate', 'seniorTechnician', 'bimLead'].includes(state.grade)) {
    return false
  }
  return elementsReadyForReview(state.elementStrength)
}

export function runProfessionalReview(state: GameState): {
  passed: boolean
  notes: string[]
  deferred: UkSpecElementId[]
} {
  ensureChartership(state)
  const weak = weakestElements(state.elementStrength, 3)
  const notes: string[] = []
  const body = state.charterBody === 'engineersIreland' ? 'Engineers Ireland' : 'CIBSE / IET'
  notes.push(`Two AI interviewers (${body}) probe your three weakest elements: ${weak.join(', ')}.`)
  if (state.charterBody === 'engineersIreland') {
    notes.push('Interview opens with a 10-minute presentation built from chosen episodes.')
  }
  if (state.sponsor.tieStrength < 1) {
    notes.push('Sponsor tie is weak — they struggle to endorse your report.')
  }

  // Pass if every element ≥ demonstrated and no crisis, and CPD on track or close
  const ready = elementsReadyForReview(state.elementStrength)
  const cpd = cpdProgress(state)
  const cpdOk = cpd.total >= 24 // two years × 40 is aspirational; mid-career run uses 24 as floor
  const clean = state.crises.length === 0 && !state.crises.includes('corner-cut')
  const sponsorOk = state.sponsor.tieStrength >= 1
  const passed = ready && cpdOk && clean && sponsorOk

  state.professionalReview.attempted = true
  state.professionalReview.passed = passed
  state.professionalReview.deferredElements = passed ? [] : weak
  state.professionalReview.notes = notes

  if (passed) {
    notes.push('Pass — chartership milestone met. Senior unlocks sooner via evidence, not time served.')
    if (!state.milestonesHit.includes('chartership')) {
      state.milestonesHit.push('chartership')
      state.milestoneProgress.chartership = 1
    }
    state.paths.commitment += 3
    logEvidence(state, {
      source: 'review',
      title: 'Professional Review — pass',
      elements: weak,
      claim: 'led',
      note: notes.join(' '),
    })
  } else {
    const why: string[] = []
    if (!ready) why.push(`strengthen ${weak.join(', ')}`)
    if (!cpdOk) why.push(`CPD ${cpd.total}/${CPD_ANNUAL_TARGET}h`)
    if (!clean) why.push('clear Corner Cut / crises')
    if (!sponsorOk) why.push('build sponsor tie (Ask Up)')
    notes.push(`Deferral — ${why.join('; ')}.`)
    state.paths.commitment = Math.max(0, state.paths.commitment - 1)
  }

  state.professionalReview.notes = notes
  return { passed, notes, deferred: state.professionalReview.deferredElements }
}

export function commitmentPathDeltaFromActions(actionCounts: Record<string, number>): number {
  let d = 0
  d += Math.min(2, actionCounts['risk-review'] ?? 0)
  d += Math.min(2, actionCounts['carbon-option'] ?? 0)
  d += Math.min(2, actionCounts['conduct-dilemma'] ?? 0)
  d += Math.min(1, actionCounts['requirements-brief'] ?? 0)
  d += Math.min(1, actionCounts['evaluate-built'] ?? 0)
  d += Math.min(2, Math.floor(((actionCounts['cpd-friday'] ?? 0) + (actionCounts['chartership-log'] ?? 0)) / 2))
  return d
}

export { CPD_BLOCK_HOURS, CPD_ANNUAL_TARGET }
