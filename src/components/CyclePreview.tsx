import { PATH_LABELS, PATH_ORDER, gateConfig } from '../data/grades'
import type { GameState, PathLine } from '../data/types'
import type { ReviewProjection } from '../game/engine'
import { fmtNum, fmtSigned, gateCountsPath } from '../game/guidance'

export function PathLineList({ lines }: { lines: PathLine[] }) {
  return (
    <ul className="path-lines">
      {lines.map((l, i) => (
        <li key={`${l.kind}-${i}`} className={`pl-${l.kind}`}>
          <span>{l.label}</span>
          {l.kind !== 'hint' && (
            <span className={`pl-amt ${l.amount > 0 ? 'up' : l.amount < 0 ? 'down' : 'flat'}`}>
              {fmtSigned(l.amount)}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

/** Desk: what the next Review would award if it were held today. */
export function CyclePreview({ state, projection }: { state: GameState; projection: ReviewProjection }) {
  const cfg = gateConfig(state.grade)
  const { delta, lines, totals, gatePass, monthsToReview } = projection
  return (
    <div className="cycle-preview">
      <div className="section-head" style={{ marginBottom: '0.35rem' }}>
        <div>
          <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
            This cycle so far · Review in {monthsToReview} mo
          </p>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>If the Review were today</h3>
        </div>
        <span className={`gate-chip ${gatePass ? 'pass' : 'miss'}`}>
          Gate {gatePass ? 'would pass' : 'would miss'}
        </span>
      </div>
      <p className="muted" style={{ fontSize: '0.82rem', margin: '0 0 0.5rem' }}>
        Actions don’t add points directly: mentors rate each slotted card from the actions behind it.
        Tap a path to see why it moves.
      </p>
      <div className="stack" style={{ gap: '0.35rem' }}>
        {PATH_ORDER.map((p) => {
          const gated = gateCountsPath(state, p)
          const low = gated && totals[p] < cfg.m1
          const d = delta[p]
          return (
            <details key={p} className={`cp-row${low ? ' low' : ''}`} open={low && d < 0}>
              <summary>
                <span className="cp-name">{PATH_LABELS[p]}</span>
                <span className="cp-calc mono">
                  {fmtNum(state.paths[p])}{' '}
                  <span className={`cp-delta ${d > 0 ? 'up' : d < 0 ? 'down' : 'flat'}`}>
                    {fmtSigned(d)}
                  </span>{' '}
                  → <strong>{fmtNum(totals[p])}</strong>
                </span>
                <span className={`cp-status ${low ? 'below' : totals[p] >= cfg.m2 ? 'm2' : 'm1'}`}>
                  {!gated && totals[p] < cfg.m1
                    ? 'not gated'
                    : low
                      ? `below M1 (${cfg.m1})`
                      : totals[p] >= cfg.m2
                        ? 'M2'
                        : 'M1'}
                </span>
              </summary>
              <PathLineList lines={lines[p]} />
            </details>
          )
        })}
      </div>
    </div>
  )
}
