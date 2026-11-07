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
  return n > 0 ? `+${n}` : `${n}`
}

export function YieldStrip({
  resources,
  burnout,
  monthPlan,
  hoverPreview,
}: {
  resources: Resources
  burnout?: boolean
  /** Cumulative yield deltas for actions already stacked this month. */
  monthPlan?: Partial<Record<keyof Resources, number>> | null
  /** Hovered next-action deltas (Civ-style before commit). */
  hoverPreview?: Partial<Record<keyof Resources, number>> | null
}) {
  return (
    <div className="yield-strip" aria-label="Yields">
      {ITEMS.map((item) => {
        const plan = monthPlan?.[item.key]
        const hover = hoverPreview?.[item.key]
        const showPlan = typeof plan === 'number' && plan !== 0
        const showHover = typeof hover === 'number' && hover !== 0
        return (
          <div
            className={`yield-chip${showHover ? ' yield-chip-preview' : ''}${showPlan ? ' yield-chip-plan' : ''}`}
            key={item.key}
          >
            <div className="label">{item.label}</div>
            <div className="value">
              {Math.round(resources[item.key])}
              {burnout && item.key !== 'hours' && item.key !== 'wellbeing' ? '*' : ''}
            </div>
            {showPlan && (
              <div className={`yield-delta month ${plan > 0 ? 'up' : 'down'}`} title="This month so far">
                {fmt(plan)}
              </div>
            )}
            {showHover && (
              <div className={`yield-delta hover ${hover > 0 ? 'up' : 'down'}`} title="If you take this action">
                next {fmt(hover)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
