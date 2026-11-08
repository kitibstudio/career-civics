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
  wellbeingFloor = 4,
}: {
  resources: Resources
  burnout?: boolean
  /** Cumulative yield deltas banked this month (running total under each yield). */
  monthPlan?: Partial<Record<keyof Resources, number>> | null
  /** Hovered next-action deltas (Civ-style before commit). */
  hoverPreview?: Partial<Record<keyof Resources, number>> | null
  wellbeingFloor?: number
}) {
  return (
    <div className="yield-strip-wrap">
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
              <div className="value" title="Career total for this yield">
                {Math.round(resources[item.key])}
                {burnout && item.key !== 'hours' && item.key !== 'wellbeing' ? '*' : ''}
              </div>
              <div
                className={`yield-delta month ${planTone}`}
                title="Banked this month — change since the month started"
              >
                {fmt(plan)}
              </div>
              {showHover && (
                <div
                  className={`yield-delta hover ${hover > 0 ? 'up' : 'down'}`}
                  title="Preview — what this yield would change if you take the highlighted action"
                >
                  next {fmt(hover)}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="yield-strip-legend" role="note">
        <span>
          <strong>Big number</strong> = career total · coloured ± = this month ·{' '}
          <strong className="leg-next">next ±</strong> = hover preview
        </span>
        <span>
          Wellbeing floor {wellbeingFloor}
          {resources.wellbeing <= wellbeingFloor ? ' · at risk' : ''}
          {burnout ? ' · Burnout: yields halved' : ''}
        </span>
      </div>
    </div>
  )
}
