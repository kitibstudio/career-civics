import { BODY_LABELS, UK_SPEC_BY_ID } from '../data/ukSpec'
import type { GameState } from '../data/types'

export function CharterReviewScreen({
  state,
  onDone,
}: {
  state: GameState
  onDone: () => void
}) {
  const pr = state.professionalReview
  return (
    <section className="screen">
      <div className="panel" style={{ padding: '1.35rem', maxWidth: 720 }}>
        <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
          Professional Review · {BODY_LABELS[state.charterBody]}
        </p>
        <h2 className="h2">{pr.passed ? 'Pass' : 'Deferral'}</h2>
        <p>
          Chartership rests on evidence, not time served. Sponsor:{' '}
          <strong>{state.sponsor.name}</strong> (tie {state.sponsor.tieStrength}/3).
        </p>
        <ul style={{ marginTop: '1rem' }}>
          {pr.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        {!pr.passed && pr.deferredElements.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>Strengthen</h3>
            <ul>
              {pr.deferredElements.map((id) => (
                <li key={id}>
                  <strong>{id}</strong> — {UK_SPEC_BY_ID[id]?.title}
                </li>
              ))}
            </ul>
          </div>
        )}
        {pr.passed && (
          <p className="muted" style={{ marginTop: '1rem' }}>
            Milestone “Pass Professional Review” logged on the Commitment path. Practice-sheet
            export of episodes by element is on Self after promotion debriefs.
          </p>
        )}
        <button className="btn btn-ink" style={{ marginTop: '1.25rem' }} onClick={onDone}>
          Back to Self
        </button>
      </div>
    </section>
  )
}
