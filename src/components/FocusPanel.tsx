import { GRADES } from '../data/grades'
import type { GameState } from '../data/types'
import type { ReviewProjection } from '../game/engine'
import { focusItems, promotionRequirements } from '../game/guidance'
import { promotionReady } from '../game/promotion'

export function FocusPanel({
  state,
  projection,
  limit = 4,
}: {
  state: GameState
  projection?: ReviewProjection
  limit?: number
}) {
  const nextId = GRADES[state.grade]?.next
  const ready = promotionReady(state)
  const reqs = promotionRequirements(state)
  const items = focusItems(state, projection).slice(0, limit)
  const target = nextId ? GRADES[nextId].name : 'Legacy'

  return (
    <div className="focus-panel">
      <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
        Next best moves
      </p>
      <h3 style={{ margin: '0 0 0.5rem', fontFamily: 'var(--font-display)' }}>
        {ready.ready
          ? `Ready for ${target} — it opens after Review`
          : `To reach ${target}, focus on…`}
      </h3>
      <ul className="req-list" aria-label="Promotion requirements">
        {reqs.map((r) => (
          <li key={r.id} className={r.done ? 'done' : ''} title={r.detail}>
            <span aria-hidden>{r.done ? '✓' : '○'}</span> {r.label}
          </li>
        ))}
      </ul>
      {items.length > 0 && (
        <ol className="focus-list">
          {items.map((it) => (
            <li key={it.id} className={`focus-${it.tone}`}>
              <strong>{it.title}</strong>
              <div>{it.detail}</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
