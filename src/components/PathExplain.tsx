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

  return (
    <div className="path-explain">
      <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
        Promotion paths
      </p>
      <PathBars paths={state.paths} grade={state.grade} compact />

      <div className="path-explain-body">
        <p>
          <strong>How levels are arrived at.</strong> Resource yields (Hours, Competence, Reputation,
          Network, Fee, Wellbeing, Growth) move when you take desk actions. Path levels
          (Delivery / Technical / Collaboration / Leadership) update at each six-month{' '}
          <strong>Review</strong>: mentor ratings on slotted Habits &amp; Specialisms × those cards’
          yields, plus milestones — not a live bar when you click.
        </p>
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          What good looks like this grade: M1 ≥{cfg.m1} on every path, M2 ≥{cfg.m2} on at least{' '}
          {cfg.gateStrong} path(s); Golden ≥{cfg.golden}. Markers on the bars show those targets.
        </p>

        <div className="cycle-glossary" role="note">
          <strong>What “This cycle: Work Across ×7 …” means</strong>
          <p>
            A <em>cycle</em> is the six months between Reviews (you are in month {monthsIntoCycle} of
            6). Each line counts how many −8h blocks of that action you have taken since the last
            Review. Mentors use those counts to rate your slotted Habits/Specialisms (e.g. more Work
            Across → stronger Collaboration evidence). It is a tally of evidence, not path points yet
            — points land at Review.
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
