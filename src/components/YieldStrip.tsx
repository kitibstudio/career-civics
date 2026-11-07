import type { Resources } from '../data/types'

const ITEMS: { key: keyof Resources; label: string }[] = [
  { key: 'hours', label: 'Hours' },
  { key: 'competence', label: 'Competence' },
  { key: 'reputation', label: 'Reputation' },
  { key: 'network', label: 'Network' },
  { key: 'fee', label: 'Fee' },
  { key: 'wellbeing', label: 'Wellbeing' },
  { key: 'growth', label: 'Growth' },
]

export function YieldStrip({
  resources,
  burnout,
  preview,
}: {
  resources: Resources
  burnout?: boolean
  /** Hovered action deltas (Civ-style before/after feedback). */
  preview?: Partial<Record<keyof Resources, number>> | null
}) {
  return (
    <div className="yield-strip" aria-label="Resources">
      {ITEMS.map((item) => {
        const delta = preview?.[item.key]
        const showDelta = typeof delta === 'number' && delta !== 0
        return (
          <div className={`yield-chip${showDelta ? ' yield-chip-preview' : ''}`} key={item.key}>
            <div className="label">{item.label}</div>
            <div className="value">
              {Math.round(resources[item.key])}
              {burnout && item.key !== 'hours' && item.key !== 'wellbeing' ? '*' : ''}
            </div>
            {showDelta && (
              <div className={`yield-delta ${delta > 0 ? 'up' : 'down'}`}>
                {delta > 0 ? `+${delta}` : delta}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
