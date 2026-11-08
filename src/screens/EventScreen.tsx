import { EVENTS } from '../data/actions'
import { UK_SPEC_BY_ID } from '../data/ukSpec'
import type { ClaimRole, GameState } from '../data/types'

export function EventScreen({
  state,
  onChoose,
  onClaim,
}: {
  state: GameState
  onChoose: (choiceId: string) => void
  onClaim?: (claim: ClaimRole) => void
}) {
  const pending = state.pendingClaim
  const event = EVENTS.find((e) => e.id === (pending?.eventId ?? state.pendingEvent))
  if (!event) return null

  const choice = pending
    ? event.choices.find((c) => c.id === pending.choiceId)
    : null

  if (pending && choice && onClaim) {
    return (
      <section className="screen">
        <div className="panel" style={{ padding: '1.35rem', maxWidth: 720 }}>
          <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
            Chartership evidence · I, not we
          </p>
          <h2 className="h2">How do you describe your part?</h2>
          <p>
            <strong>{event.title}</strong> — {choice.label}
          </p>
          <p className="muted">
            Assessors only credit “I led” / “I contributed” claims that match what you did. “We did
            it” stays at mentioned strength.
          </p>
          {event.elements && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              Elements: {event.elements.map((id) => `${id} ${UK_SPEC_BY_ID[id]?.short}`).join(' · ')}
            </p>
          )}
          <div className="stack" style={{ marginTop: '1rem' }}>
            {(
              [
                ['led', 'I led it — strong evidence'],
                ['contributed', 'I contributed — demonstrated'],
                ['we', 'We did it — mentioned only'],
              ] as const
            ).map(([id, label]) => (
              <button key={id} className="action-row" onClick={() => onClaim(id)}>
                <div>
                  <div className="action-title">{label}</div>
                  <div className="action-blurb">{choice.result}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="screen">
      <div className="panel" style={{ padding: '1.35rem', maxWidth: 720 }}>
        <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
          Narrative event
          {event.elements ? ` · UK-SPEC ${event.elements.join(', ')}` : ''}
        </p>
        <h2 className="h2">{event.title}</h2>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.5 }}>{event.body}</p>
        <p className="muted">No single right answer — each choice leaves a different lesson.</p>
        <div className="stack" style={{ marginTop: '1rem' }}>
          {event.choices.map((c) => (
            <button key={c.id} className="action-row" onClick={() => onChoose(c.id)}>
              <div>
                <div className="action-title">{c.label}</div>
                <div className="action-blurb">Consequences land after you choose.</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
