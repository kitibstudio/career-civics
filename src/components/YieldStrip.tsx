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

export function YieldStrip({ resources, burnout }: { resources: Resources; burnout?: boolean }) {
  return (
    <div className="yield-strip" aria-label="Resources">
      {ITEMS.map((item) => (
        <div className="yield-chip" key={item.key}>
          <div className="label">{item.label}</div>
          <div className="value">
            {Math.round(resources[item.key])}
            {burnout && item.key !== 'hours' && item.key !== 'wellbeing' ? '*' : ''}
          </div>
        </div>
      ))}
    </div>
  )
}
