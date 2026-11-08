import { CARD_BY_ID } from '../data/cards'
import { PATH_LABELS, PATH_ORDER, gateConfig } from '../data/grades'
import type { GameState, PathId } from '../data/types'
import { PathBars } from '../components/PathBars'
import { PathLineList } from '../components/CyclePreview'
import { RATING_LABELS, promotionEvidence } from '../game/engine'
import { fmtNum, fmtSigned, gateCountsPath } from '../game/guidance'

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

  const lines = review.pathLines
  const slotsEmpty =
    review.slotsMax != null && review.slotsUsed != null
      ? Math.max(0, review.slotsMax - review.slotsUsed)
      : 0
  const growthShort = Math.max(0, cfg.growthNeed - state.growthBanked)

  const takeaways: string[] = []
  if (lines) {
    const idle = lines.delivery.find((l) => l.kind === 'idle')
    if (idle) takeaways.push(`${idle.label} cost ${fmtSigned(idle.amount)} Delivery. Spend those hours on real work next cycle.`)
    const overhead = lines.delivery.find((l) => l.kind === 'overhead' && l.amount < 0)
    if (overhead)
      takeaways.push(`${overhead.label} cost ${fmtSigned(overhead.amount)} Delivery. Keep internal meetings to the allowance.`)
    for (const p of PATH_ORDER) {
      const hint = lines[p].find((l) => l.kind === 'hint')
      if (hint) takeaways.push(`${hint.label}. Slot a ${PATH_LABELS[p]} card so that work counts.`)
      const drift = lines[p].find((l) => l.kind === 'neglect')
      if (drift) takeaways.push(`${drift.label} (${fmtSigned(drift.amount)}).`)
    }
  }
  if (slotsEmpty) takeaways.push(`${slotsEmpty} of ${review.slotsMax} card slots were empty — they scored nothing.`)
  for (const id of review.crisesDrawn) {
    const c = CARD_BY_ID[id]
    takeaways.push(`Crisis drawn: ${c?.name ?? id}. Its clearer habit is now slotted — keep it there.`)
  }
  const belowM1 = PATH_ORDER.filter((p) => gateCountsPath(state, p) && review.pathTotals[p] < cfg.m1)
  const strong = PATH_ORDER.filter((p) => gateCountsPath(state, p) && review.pathTotals[p] >= cfg.m2)

  return (
    <section className="screen">
      <div className="panel" style={{ padding: '1.25rem' }}>
        <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
          Six-monthly review
        </p>
        <h2 className="h2">
          Gate {review.gatePass ? 'passed' : 'missed'} · streak {Math.min(2, state.consecutiveGate)}/2
        </h2>
        <p className="muted">
          {review.gatePass
            ? `Every path at M1 (${cfg.m1}+) and ${strong.length} at M2 (${cfg.m2}+).`
            : belowM1.length
              ? `${belowM1.map((p) => `${PATH_LABELS[p]} (${fmtNum(review.pathTotals[p])})`).join(', ')} below M1 (${cfg.m1}). The gate needs every path at M1 and ${cfg.gateStrong} at M2 (${cfg.m2}).`
              : `Every path is at M1, but none reached M2 (${cfg.m2}). The gate needs ${cfg.gateStrong} strong path.`}{' '}
          Growth +{review.growthGained} → {state.growthBanked}/{cfg.growthNeed}
          {growthShort > 0 ? ` (${growthShort} to go)` : ' (met)'}.
        </p>

        {takeaways.length > 0 && (
          <div className="review-takeaways">
            <p className="eyebrow" style={{ color: 'var(--signal)', marginBottom: '0.3rem' }}>
              What moved the needle the wrong way
            </p>
            <ul>
              {takeaways.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="desk-grid" style={{ marginTop: '1rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>Why each path moved</h3>
            {lines ? (
              <div className="stack" style={{ gap: '0.5rem' }}>
                {PATH_ORDER.map((p: PathId) => {
                  const d = review.pathDelta[p]
                  return (
                    <div key={p} className="review-path">
                      <div className="review-path-head">
                        <strong>{PATH_LABELS[p]}</strong>
                        <span className="mono">
                          <span className={`cp-delta ${d > 0 ? 'up' : d < 0 ? 'down' : 'flat'}`}>
                            {fmtSigned(d)}
                          </span>{' '}
                          → total {fmtNum(review.pathTotals[p])}
                        </span>
                      </div>
                      <PathLineList lines={lines[p]} />
                    </div>
                  )
                })}
              </div>
            ) : (
              <ul>
                {review.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}

            <h3 style={{ fontFamily: 'var(--font-display)', marginTop: '1rem' }}>Card ratings</h3>
            <div className="stack">
              {Object.entries(review.ratings).map(([id, rating]) => (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <strong>{CARD_BY_ID[id]?.name ?? id}</strong>
                    <div className="muted">{CARD_BY_ID[id]?.path}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)' }}>{RATING_LABELS[rating]}</div>
                </div>
              ))}
              {slotsEmpty > 0 && (
                <p className="slot-callout">
                  {slotsEmpty} of {review.slotsMax} slot{review.slotsMax === 1 ? '' : 's'} empty this
                  cycle.
                </p>
              )}
            </div>
            <p className="muted" style={{ fontSize: '0.8rem' }}>
              Ratings: 2+ matching actions = Emerging; 6+ spread over 4+ months = Consistent; plus
              positive feedback = Role model.
            </p>

            {lines && !!review.notes.length && (
              <details className="score-recipe" style={{ marginTop: '0.75rem' }}>
                <summary>Mentor notes</summary>
                <ul>
                  {review.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          <div>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>Paths after this Review</h3>
            <PathBars
              paths={review.pathTotals}
              grade={state.grade}
              reviewsDone={state.reviewsDone}
              monthInCycle={6}
              delta={review.pathDelta}
            />
            <div style={{ marginTop: '0.75rem' }}>
              <div className="muted">Milestones (each +1 to its path every Review once done)</div>
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
