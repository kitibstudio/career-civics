import { PATH_LABELS, PATH_ORDER, gateConfig } from '../data/grades'
import type { GradeId, PathScores } from '../data/types'
import { commitmentRequired } from '../game/engine'
import { fmtNum, fmtSigned } from '../game/guidance'

const PATHS = PATH_ORDER

export function PathBars({
  paths,
  grade,
  compact,
  reviewsDone = 0,
  monthInCycle = 1,
  delta,
  deltaLabel = 'this Review',
}: {
  paths: PathScores
  grade: GradeId
  compact?: boolean
  /** Reviews completed this career — 0 means scores have never landed. */
  reviewsDone?: number
  /** 1–6 within the current six-month cycle. */
  monthInCycle?: number
  /** Optional per-path change shown beside each total. */
  delta?: PathScores
  deltaLabel?: string
}) {
  const cfg = gateConfig(grade)
  const max = cfg.golden + 2
  const pct = (n: number) => `${Math.max(0, Math.min(100, (n / max) * 100))}%`
  const preReview = reviewsDone === 0 && !delta
  const monthsToReview = Math.max(0, 6 - monthInCycle + 1)

  return (
    <div className="path-bars">
      {preReview && (
        <p className="path-pre-review">
          Awaiting first Review (in {monthsToReview} month{monthsToReview === 1 ? '' : 's'}). Path
          totals stay at 0 until then — <strong>Below gate</strong> here just means “not scored
          yet,” not that you are failing.
        </p>
      )}
      <details className="gate-glossary">
        <summary>
          What good looks like · M1 ≥{cfg.m1} · M2 ≥{cfg.m2} (≥{cfg.gateStrong}) · Golden ≥
          {cfg.golden}
        </summary>
        <p>
          Path points land at six-monthly Reviews (not when you click desk actions).{' '}
          <strong>M1</strong> = minimum on every path to pass the gate. <strong>M2</strong> = strong
          path (need ≥{cfg.gateStrong}). <strong>Golden</strong> = exceptional (Habit carry on
          promotion). From Engineer grade, <strong>Commitment</strong> (UK-SPEC E — safety, ethics,
          sustainability, CPD) must also sit at M1 or Corner Cut risks drawing.
        </p>
      </details>

      {PATHS.map((p) => {
        const v = paths[p] ?? 0
        const awaiting = preReview && v === 0
        const gated = p !== 'commitment' || commitmentRequired(grade)
        const mark = awaiting
          ? 'Awaiting Review'
          : v >= cfg.golden
            ? 'Golden'
            : v >= cfg.m2
              ? 'M2'
              : v >= cfg.m1
                ? 'M1'
                : gated
                  ? 'Below gate'
                  : 'Below M1 · not gated yet'
        const tone = awaiting
          ? 'await'
          : v >= cfg.golden
            ? 'golden'
            : v >= cfg.m2
              ? 'm2'
              : v >= cfg.m1
                ? 'm1'
                : 'below'
        const need = awaiting
          ? 'Desk actions this cycle become evidence; points land at Review'
          : v < cfg.m1
            ? `${cfg.m1 - v} short of M1 (${cfg.m1}) · M2 is ${cfg.m2}`
            : v < cfg.m2
              ? `M1 met · ${cfg.m2 - v} more for M2 (${cfg.m2})`
              : v < cfg.golden
                ? `M2 met · ${cfg.golden - v} more for Golden (${cfg.golden})`
                : 'Golden — exceptional'
        const d = delta?.[p]
        return (
          <div className="path-row" key={p}>
            <div>
              <strong>{PATH_LABELS[p]}</strong>
              <div className={`path-mark ${tone}`}>{mark}</div>
              {!compact && (
                <div className="muted" style={{ fontSize: '0.75rem' }}>
                  {need}
                </div>
              )}
            </div>
            <div className="bar-track" aria-hidden>
              <div className="bar-marker m1" style={{ left: pct(cfg.m1) }} title={`M1 ${cfg.m1}`} />
              <div className="bar-marker m2" style={{ left: pct(cfg.m2) }} title={`M2 ${cfg.m2}`} />
              <div
                className="bar-marker golden"
                style={{ left: pct(cfg.golden) }}
                title={`Golden ${cfg.golden}`}
              />
              <div className={`bar-fill tone-${tone}`} style={{ width: pct(v) }} />
            </div>
            <div className="path-value" title={need}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmtNum(v)}</span>
              <span className="path-value-target"> pts</span>
              {d != null && (
                <div className={`path-value-delta ${d > 0 ? 'up' : d < 0 ? 'down' : 'flat'}`}>
                  {fmtSigned(d)} {deltaLabel}
                </div>
              )}
            </div>
          </div>
        )
      })}
      <div className="path-legend">
        <span>
          <i className="bar-marker-swatch m1" /> M1 {cfg.m1}
        </span>
        <span>
          <i className="bar-marker-swatch m2" /> M2 {cfg.m2}
        </span>
        <span>
          <i className="bar-marker-swatch golden" /> Golden {cfg.golden}
        </span>
        <span className="path-legend-note">
          Number = path points this grade (reset on promotion). Bars below 0 show empty.
        </span>
      </div>
    </div>
  )
}
