import type { ActionDef, GameState, PathId, Resources } from '../data/types'
import { actionYieldPreview } from '../game/engine'

const YIELD_ORDER: { key: keyof Resources; label: string }[] = [
  { key: 'hours', label: 'Hours' },
  { key: 'competence', label: 'Competence' },
  { key: 'reputation', label: 'Reputation' },
  { key: 'network', label: 'Network' },
  { key: 'fee', label: 'Fee' },
  { key: 'wellbeing', label: 'Wellbeing' },
  { key: 'growth', label: 'Growth' },
]

const PATH_LABEL: Record<PathId, string> = {
  delivery: 'Delivery',
  technical: 'Technical',
  collaboration: 'Collaboration',
  leadership: 'Leadership',
  commitment: 'Commitment',
}

function fmt(n: number): string {
  if (n === 0) return '0'
  return n > 0 ? `+${n}` : `${n}`
}

export function ActionYields({ state, action }: { state: GameState; action: ActionDef }) {
  const preview = actionYieldPreview(state, action)

  return (
    <div className="action-yields">
      <div className="action-yield-row" aria-label="Yield impact">
        {YIELD_ORDER.map(({ key, label }) => {
          const value = key === 'hours' ? preview.hoursDelta : (preview.resources[key] ?? 0)
          const tone = value > 0 ? 'up' : value < 0 ? 'down' : 'flat'
          return (
            <span key={key} className={`action-yield-chip ${tone}`}>
              <span className="ay-label">{label}</span>
              <span className="ay-value">{fmt(value)}</span>
            </span>
          )
        })}
        {preview.projectProgress ? (
          <span className="action-yield-chip up">
            <span className="ay-label">Project</span>
            <span className="ay-value">{fmt(preview.projectProgress)}</span>
          </span>
        ) : null}
      </div>
      {(preview.pathLean.length > 0 || preview.reviewHint) && (
        <div className="action-yield-meta">
          {preview.pathLean.length > 0 && (
            <span className="action-path-lean">
              Feeds {preview.pathLean.map((p) => PATH_LABEL[p]).join(' · ')} at Review
            </span>
          )}
          {preview.reviewHint && <span className="action-review-hint">{preview.reviewHint}</span>}
        </div>
      )}
    </div>
  )
}
