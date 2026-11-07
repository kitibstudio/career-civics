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
  return (
    <div className="path-bars">
      {PATHS.map((p) => {
        const v = paths[p]
        const mark =
          v >= cfg.golden ? 'Golden' : v >= cfg.m2 ? 'M2' : v >= cfg.m1 ? 'M1' : 'Below'
        return (
          <div className="path-row" key={p}>
            <div>
              <strong>{PATH_LABELS[p]}</strong>
              {!compact && <div className="muted" style={{ fontSize: '0.8rem' }}>{mark}</div>}
            </div>
            <div className="bar-track" aria-hidden>
              <div className="bar-fill" style={{ width: `${Math.min(100, (v / max) * 100)}%` }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{v}</div>
          </div>
        )
      })}
    </div>
  )
}
