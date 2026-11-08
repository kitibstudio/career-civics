import { CARD_BY_ID } from '../data/cards'
import { PATH_LABELS, gateConfig } from '../data/grades'
import type { GameState } from '../data/types'
import { PathBars } from '../components/PathBars'
import { promotionEvidence } from '../game/engine'

export function ReviewScreen({
  state,
  onContinue,
}: {
  state: GameState
  onContinue: () => void
}) {
  const review = state.lastReview
  const cfg = gateConfig(state.grade)
  const evidence = promotionEvidence(state)

  if (!review) {
    return (
      <section className="screen">
        <div className="panel" style={{ padding: '1.2rem' }}>
          <p>No review yet.</p>
          <button className="btn btn-ink" onClick={onContinue}>
            Continue
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="screen">
      <div className="panel" style={{ padding: '1.25rem' }}>
        <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
          Six-monthly review
        </p>
        <h2 className="h2">Mentor ratings</h2>
        <p className="muted">
          A Civics Turn. Cards rated from your last six months of actions. Gate: every path at{' '}
          <strong>M1</strong> (minimum, {cfg.m1}+) and {cfg.gateStrong} path(s) at <strong>M2</strong>{' '}
          (strong, {cfg.m2}+). <strong>Golden</strong> ({cfg.golden}+) is exceptional — not required
          to pass, but carries a Habit free on promotion.
        </p>

        <div className="desk-grid" style={{ marginTop: '1rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>Slotted cards</h3>
            <div className="stack">
              {Object.entries(review.ratings).map(([id, rating]) => (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <strong>{CARD_BY_ID[id]?.name ?? id}</strong>
                    <div className="muted">{CARD_BY_ID[id]?.path}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', textTransform: 'capitalize' }}>
                    {rating.replace(/([A-Z])/g, ' $1')}
                  </div>
                </div>
              ))}
            </div>

            {!!review.notes.length && (
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)' }}>Notes</h3>
                <ul>
                  {review.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>Paths after this Turn</h3>
            <PathBars
              paths={review.pathTotals}
              grade={state.grade}
              reviewsDone={state.reviewsDone}
              monthInCycle={6}
            />
            <div style={{ marginTop: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
              <div>Growth this Turn: +{review.growthGained}</div>
              <div>Growth banked: {state.growthBanked} / {cfg.growthNeed}</div>
              <div>
                Gate: {review.gatePass ? 'Pass' : 'Miss'} · Streak {state.consecutiveGate}/2
              </div>
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <div className="muted">Milestones evidence</div>
              {evidence.milestonesHit.map((m) => (
                <div key={m.id}>
                  {m.hit ? '✓' : '○'} {m.label}{' '}
                  <span className="muted">({PATH_LABELS[m.path]})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem' }}>
          <button className="btn btn-ink" onClick={onContinue}>
            {state.consecutiveGate >= 2 && state.crises.length === 0
              ? 'Continue toward promotion'
              : 'Set next loadout'}
          </button>
        </div>
      </div>
    </section>
  )
}
