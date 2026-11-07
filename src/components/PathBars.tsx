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
      <div className="path-grade-target" aria-label={`Good for this grade`}>
        <span>
          This grade — good looks like M1 ≥{cfg.m1} on every path, M2 ≥{cfg.m2} on ≥{cfg.gateStrong},
          Golden ≥{cfg.golden}
        </span>
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
            <div className="path-value">
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
      </div>
    </div>
  )
}
