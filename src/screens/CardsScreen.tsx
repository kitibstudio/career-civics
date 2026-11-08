import { CARD_BY_ID } from '../data/cards'
import { deskifyCardText } from '../data/deskNames'
import { PATH_LABELS } from '../data/grades'
import type { GameState } from '../data/types'
import { availableCards, cardScoringPath, slotCount } from '../game/engine'
import { PATH_ORDER } from '../data/grades'

export function CardsScreen({
  state,
  onToggle,
  onDone,
}: {
  state: GameState
  onToggle: (id: string) => void
  onDone?: () => void
}) {
  const cards = availableCards(state)
  const max = slotCount(state)
  const empty = Math.max(0, max - state.slotted.length)
  const carded = new Set(
    state.slotted.map((id) => (CARD_BY_ID[id] ? cardScoringPath(CARD_BY_ID[id]) : null)),
  )
  const uncovered = PATH_ORDER.filter((p) => p !== 'commitment' && !carded.has(p))

  return (
    <section className="screen">
      <div className="panel" style={{ padding: '1.2rem' }}>
        <div className="section-head">
          <div>
            <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
              Cards
            </p>
            <h2 className="h2">Habits & Specialisms</h2>
            <p className="muted">
              Shared slots ({state.slotted.length}/{max}). Habits drop at promotion; Specialisms stay
              slottable. Crises occupy a slot until cleared.
            </p>
          </div>
          {onDone && (
            <button className="btn btn-ink" onClick={onDone}>
              Back to desk
            </button>
          )}
        </div>

        {empty > 0 && (
          <p className="slot-callout">
            {empty} of {max} slot{max === 1 ? '' : 's'} empty — an empty slot scores nothing at Review.
          </p>
        )}
        {uncovered.length > 0 && (
          <p className="muted" style={{ fontSize: '0.88rem' }}>
            No card on: <strong>{uncovered.map((p) => PATH_LABELS[p]).join(', ')}</strong>. Actions on
            those paths score nothing at Review, and paths left unfed for several Reviews draw Drift
            or a Crisis. (Commitment scores from desk work directly.)
          </p>
        )}

        <div className="card-grid">
          {cards.map((card) => {
            const on = state.slotted.includes(card.id)
            const lockedCrisis = card.kind === 'crisis'
            return (
              <button
                key={card.id}
                className={`card-tile ${on ? 'on' : ''} ${lockedCrisis ? 'crisis' : ''}`}
                onClick={() => onToggle(card.id)}
                disabled={lockedCrisis}
                aria-pressed={on}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span className="tag">
                    {card.kind} ·{' '}
                    {card.path === 'crisis' ? 'crisis' : PATH_LABELS[card.path]}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                    {on ? 'SLOTTED' : 'slot'}
                  </span>
                </div>
                <div className="muted" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  {cardScoringPath(card)
                    ? `Scores ${PATH_LABELS[cardScoringPath(card)!]} at Review`
                    : 'Penalises paths until cleared'}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>
                  {card.name}
                </div>
                <div style={{ fontSize: '0.9rem' }}>{deskifyCardText(card.effect)}</div>
                <div className="muted" style={{ fontSize: '0.82rem', marginTop: 'auto' }}>
                  In practice: {deskifyCardText(card.practice)}
                </div>
              </button>
            )
          })}
        </div>

        {!!state.crises.length && (
          <p className="tip" style={{ marginTop: '1rem', color: 'var(--ink)' }}>
            Active crises:{' '}
            {state.crises.map((id) => CARD_BY_ID[id]?.name ?? id).join(', ')}. Clear by running the
            counter Habit at Consistent for a review.
          </p>
        )}
      </div>
    </section>
  )
}
