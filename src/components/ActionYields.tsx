import type { ActionDef, GameState, PathId, Resources } from '../data/types'
import { actionYieldPreview } from '../game/engine'

const RESOURCE_LABEL: Partial<Record<keyof Resources, string>> = {
  competence: 'Competence',
  reputation: 'Reputation',
  network: 'Network',
  fee: 'Fee',
  wellbeing: 'Wellbeing',
  growth: 'Growth',
}

const PATH_LABEL: Record<PathId, string> = {
  delivery: 'Delivery',
  technical: 'Technical',
  collaboration: 'Collaboration',
  leadership: 'Leadership',
}

function fmt(n: number): string {
  return n > 0 ? `+${n}` : `${n}`
}

export function ActionYields({ state, action }: { state: GameState; action: ActionDef }) {
  const preview = actionYieldPreview(state, action)
  const chips: { key: string; label: string; value: number; tone: 'up' | 'down' | 'hours' }[] = []

  chips.push({
    key: 'hours',
    label: 'Hours',
    value: preview.hoursDelta,
    tone: 'hours',
  })

  for (const [key, label] of Object.entries(RESOURCE_LABEL) as [keyof Resources, string][]) {
    const v = preview.resources[key]
    if (typeof v !== 'number' || v === 0) continue
    chips.push({
      key,
      label,
      value: v,
      tone: v > 0 ? 'up' : 'down',
    })
  }

  if (preview.projectProgress) {
    chips.push({
      key: 'project',
      label: 'Project',
      value: preview.projectProgress,
      tone: 'up',
    })
  }

  return (
    <div className="action-yields">
      <div className="action-yield-row" aria-label="Yield impact">
        {chips.map((chip) => (
          <span key={chip.key} className={`action-yield-chip ${chip.tone}`}>
            <span className="ay-label">{chip.label}</span>
            <span className="ay-value">{fmt(chip.value)}</span>
          </span>
        ))}
      </div>
      {(preview.pathLean.length > 0 || preview.reviewHint) && (
        <div className="action-yield-meta">
          {preview.pathLean.length > 0 && (
            <span className="action-path-lean">
              Leans {preview.pathLean.map((p) => PATH_LABEL[p]).join(' · ')}
            </span>
          )}
          {preview.reviewHint && <span className="action-review-hint">{preview.reviewHint}</span>}
        </div>
      )}
    </div>
  )
}
