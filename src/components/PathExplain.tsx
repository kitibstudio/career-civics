import { PATH_LABELS, gateConfig } from '../data/grades'
import type { GameState, PathId } from '../data/types'
import { pathActionEvidence } from '../game/engine'
import { PathBars } from './PathBars'

const PATH_HOW: Record<PathId, string> = {
  delivery:
    'Billable finish — drawings, reviews, timesheets. Unutilized (−8h) blocks cut Delivery at Review because idle hours produce no Fee yield and no package evidence.',
  technical:
    'Hard craft — calc packages, model layouts, CPD, automation. Competence yield from these actions rates your Technical habits/specialisms.',
  collaboration:
    'Interfaces — Work Across, client meetings, clash cycles, site visits, Lunch & Learn. Network and Reputation yields feed this path.',
  leadership:
    'People — Ask Up, Support Down, mentoring, CPD. Growth and Reputation yields from these actions lift Leadership.',
  commitment:
    'Professional commitment (UK-SPEC E) — risk reviews, carbon options, ethics/conduct, CPD hours, chartership log. Neglect draws Corner Cut; Engineer+ gate needs Commitment at M1.',
}

export function PathExplain({ state }: { state: GameState }) {
  const evidence = pathActionEvidence(state)
  const cfg = gateConfig(state.grade)
  const monthsIntoCycle = ((state.monthInGrade - 1) % 6) + 1
  const last = state.lastReview

  return (
    <div className="path-explain">
      <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
        Promotion paths
      </p>
      <PathBars paths={state.paths} grade={state.grade} compact />

      <div className="path-explain-body">
        <details className="score-recipe">
          <summary>How path scores work (Review recipe)</summary>
          <p>
            Bar numbers are <strong>path totals this grade</strong> (e.g. 3 / {cfg.m2} = current / M2).
            Points add only at Review: base +{cfg.base}, slotted cards × mentor rating, milestones,
            −1 Delivery per Unutilized block, crisis penalties.
          </p>
          {last && (
            <p className="last-review-delta">
              Last Review:{' '}
              {(Object.keys(PATH_HOW) as PathId[])
                .map((p) => `${PATH_LABELS[p]} ${last.pathDelta[p] >= 0 ? '+' : ''}${last.pathDelta[p]}`)
                .join(' · ')}
              {last.gatePass ? ' · gate passed' : ' · gate missed'}
            </p>
          )}
        </details>

        <details className="cycle-glossary">
          <summary>What “This cycle: Work Across ×N” means (month {monthsIntoCycle}/6)</summary>
          <p>
            Counts of −8h blocks since the last Review. Mentors use them to rate slotted cards —
            evidence tallies, not live path points.
          </p>
        </details>

        <ul className="path-how-list">
          {(Object.keys(PATH_HOW) as PathId[]).map((p) => {
            const bits = evidence[p]
            return (
              <li key={p}>
                <strong>{PATH_LABELS[p]}</strong> — {PATH_HOW[p]}
                {bits.length > 0 ? (
                  <div className="path-evidence">
                    This cycle (evidence tallies):{' '}
                    {bits.map((b) => `${b.label} ×${b.count}`).join(' · ')}
                  </div>
                ) : (
                  <div className="path-evidence">This cycle: no feeding actions yet</div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
