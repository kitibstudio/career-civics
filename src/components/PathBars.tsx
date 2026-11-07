import { PATH_LABELS, gateConfig } from '../data/grades'
import type { GradeId, PathScores } from '../data/types'

const PATHS = ['delivery', 'technical', 'collaboration', 'leadership'] as const

export function PathBars({
  paths,
  grade,
  compact,
}: {
  paths: PathScores
  grade: GradeId
  compact?: boolean
}) {
  const cfg = gateConfig(grade)
  const max = cfg.golden + 2
  const pct = (n: number) => `${Math.min(100, (n / max) * 100)}%`

  return (
    <div className="path-bars">
      <div className="gate-glossary" role="note">
        <p>
          <strong>What M1 / M2 / Golden mean</strong> — path points from six-monthly Reviews. They are
          not monthly yields.
        </p>
        <ul>
          <li>
            <strong>M1 (Milestone 1)</strong> — minimum bar for this grade ({cfg.m1}+). You need{' '}
            <em>every</em> path at M1 to pass the promotion gate.
          </li>
          <li>
            <strong>M2 (Milestone 2)</strong> — strong path ({cfg.m2}+). Gate also needs at least{' '}
            {cfg.gateStrong} path(s) at M2.
          </li>
          <li>
            <strong>Golden</strong> — exceptional path ({cfg.golden}+). Unlocks Golden Age carry (keep
            a matching Habit free on promotion).
          </li>
        </ul>
      </div>

      <div className="path-grade-target" aria-label="Good for this grade">
        This grade — good looks like M1 ≥{cfg.m1} on every path, M2 ≥{cfg.m2} on ≥{cfg.gateStrong},
        Golden ≥{cfg.golden}. Markers on each bar show those thresholds.
      </div>

      {PATHS.map((p) => {
        const v = paths[p]
        const mark =
          v >= cfg.golden ? 'Golden' : v >= cfg.m2 ? 'M2' : v >= cfg.m1 ? 'M1' : 'Below gate'
        const tone =
          v >= cfg.golden ? 'golden' : v >= cfg.m2 ? 'm2' : v >= cfg.m1 ? 'm1' : 'below'
        return (
          <div className="path-row" key={p}>
            <div>
              <strong>{PATH_LABELS[p]}</strong>
              <div className={`path-mark ${tone}`}>{mark}</div>
              {!compact && (
                <div className="muted" style={{ fontSize: '0.75rem' }}>
                  Target M1 {cfg.m1} · M2 {cfg.m2} · Golden {cfg.golden}
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
            <div className="path-value" title={`Path total this grade ${v} · M2 target ${cfg.m2}`}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{v}</span>
              <span className="path-value-target">/{cfg.m2}</span>
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
          Right number = path total this grade / M2 target (points add at Review)
        </span>
      </div>
    </div>
  )
}
