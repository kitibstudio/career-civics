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
        <div className="score-recipe" role="note">
          <strong>How the 1–{cfg.golden} path numbers work (they are not arbitrary)</strong>
          <p>
            The big number on each bar (e.g. <code>3 / {cfg.m2}</code>) is your{' '}
            <strong>path total this grade</strong> over the M2 target. Points are added only at each
            six-month <strong>Review</strong> — desk clicks move yields now; paths update later.
          </p>
          <ol>
            <li>
              <strong>Base:</strong> every path gets +{cfg.base} just for surviving the cycle.
            </li>
            <li>
              <strong>Slotted cards:</strong> each Habit / Specialism scores into its path. Mentors
              rate the card from your cycle evidence (Not shown → Emerging → Consistent → Role model).
              Rating multiplies the card’s yields (0× / 0.5× / 1× / 1.5×).
            </li>
            <li>
              <strong>Milestones:</strong> +1 to the matching path when you have hit that grade
              milestone (calc package, drawing set, etc.).
            </li>
            <li>
              <strong>Idle drag:</strong> each Unutilized (−8h) block this cycle −1 Delivery.
            </li>
            <li>
              <strong>Crises / morale:</strong> slotted crises and failed morale checks can subtract.
            </li>
          </ol>
          <p>
            Those Review deltas <em>stack</em> across the grade. M1 ({cfg.m1}), M2 ({cfg.m2}), and
            Golden ({cfg.golden}) are thresholds on that running total — not a separate 1–5 star
            rating.
          </p>
          {last && (
            <p className="last-review-delta">
              Last Review deltas:{' '}
              {(Object.keys(PATH_HOW) as PathId[])
                .map((p) => {
                  const d = last.pathDelta[p]
                  const sign = d > 0 ? `+${d}` : `${d}`
                  return `${PATH_LABELS[p]} ${sign}`
                })
                .join(' · ')}
              {last.gatePass ? ' · gate passed' : ' · gate missed'}
            </p>
          )}
        </div>

        <p className="muted" style={{ fontSize: '0.85rem' }}>
          Gate this grade: every path ≥ M1 ({cfg.m1}), and at least {cfg.gateStrong} path(s) ≥ M2 (
          {cfg.m2}). Golden ({cfg.golden}) is optional excellence — keep a matching Habit free on
          promotion.
        </p>

        <div className="cycle-glossary" role="note">
          <strong>What “This cycle: Work Across ×7 …” means</strong>
          <p>
            A <em>cycle</em> is the six months between Reviews (you are in month {monthsIntoCycle} of
            6). Each line counts how many −8h blocks of that action you have taken since the last
            Review. Mentors use those counts to rate your slotted Habits/Specialisms (e.g. more Work
            Across → stronger Collaboration evidence). It is a tally of evidence, not path points yet
            — points land at Review via the recipe above.
          </p>
        </div>

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
