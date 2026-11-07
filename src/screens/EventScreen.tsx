import { EVENTS } from '../data/actions'
import type { GameState } from '../data/types'

export function EventScreen({
  state,
  onChoose,
}: {
  state: GameState
  onChoose: (choiceId: string) => void
}) {
  const event = EVENTS.find((e) => e.id === state.pendingEvent)
  if (!event) return null

  return (
    <section className="screen">
      <div className="panel" style={{ padding: '1.35rem', maxWidth: 720 }}>
        <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
          Narrative event
        </p>
        <h2 className="h2">{event.title}</h2>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.5 }}>{event.body}</p>
        <p className="muted">No single right answer — each choice leaves a different lesson.</p>
        <div className="stack" style={{ marginTop: '1rem' }}>
          {event.choices.map((choice) => (
            <button
              key={choice.id}
              className="action-row"
              onClick={() => onChoose(choice.id)}
            >
              <div>
                <div className="action-title">{choice.label}</div>
                <div className="action-blurb">Consequences land after you choose.</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
