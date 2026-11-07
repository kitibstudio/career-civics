import type { GameState } from '../data/types'
import { PATH_LABELS } from '../data/grades'
import type { PathId } from '../data/types'

export function WinScreen({
  state,
  onRestart,
}: {
  state: GameState
  onRestart: () => void
}) {
  const path = state.ended?.path as PathId | undefined
  return (
    <section className="screen hero-title" style={{ alignItems: 'center' }}>
      <div className="panel" style={{ padding: '1.6rem', maxWidth: 640 }}>
        <p className="eyebrow" style={{ color: 'var(--cyan-deep)' }}>
          Legacy
        </p>
        <h1 className="h2 brand-mark">Where you ended up</h1>
        <p>
          {path ? (
            <>
              Strongest Career Civics path: <strong>{PATH_LABELS[path]}</strong>.
            </>
          ) : (
            'Career complete.'
          )}
        </p>
        <p style={{ fontSize: '1.05rem' }}>{state.ended?.epilogue}</p>
        <p className="muted">
          All four Legacy endings are valid. Real careers don’t rank them either.
        </p>
        <button className="btn btn-ink" style={{ marginTop: '1rem' }} onClick={onRestart}>
          New career
        </button>
      </div>
    </section>
  )
}
