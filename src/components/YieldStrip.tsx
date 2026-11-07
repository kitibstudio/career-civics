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

function fmt(n: number): string {
  if (n > 0) return `+${n}`
  if (n < 0) return `${n}`
  return '+0'
}

export function YieldStrip({
  resources,
  burnout,
  monthPlan,
  hoverPreview,
}: {
  resources: Resources
  burnout?: boolean
  /** Cumulative yield deltas banked this month (running total under each yield). */
  monthPlan?: Partial<Record<keyof Resources, number>> | null
  /** Hovered next-action deltas (Civ-style before commit). */
  hoverPreview?: Partial<Record<keyof Resources, number>> | null
}) {
  return (
    <div className="yield-strip" aria-label="Yields">
      {ITEMS.map((item) => {
        const plan = monthPlan?.[item.key] ?? 0
        const hover = hoverPreview?.[item.key]
        const showHover = typeof hover === 'number' && hover !== 0
        const planTone = plan > 0 ? 'up' : plan < 0 ? 'down' : 'flat'
        return (
          <div
            className={`yield-chip yield-chip-plan${showHover ? ' yield-chip-preview' : ''}`}
            key={item.key}
          >
            <div className="label">{item.label}</div>
            <div className="value">
              {Math.round(resources[item.key])}
              {burnout && item.key !== 'hours' && item.key !== 'wellbeing' ? '*' : ''}
            </div>
            <div
              className={`yield-delta month ${planTone}`}
              title="Points banked this month"
            >
              {fmt(plan)}
            </div>
            {showHover && (
              <div
                className={`yield-delta hover ${hover > 0 ? 'up' : 'down'}`}
                title="If you take this action"
              >
                next {fmt(hover)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
