import type { GameState, ScreenId } from '../data/types'
import { GRADES } from '../data/grades'
import { CHARACTERS } from '../data/characters'
import { CareerLadderStrip } from './CareerLadder'

const TABS: { id: ScreenId; label: string }[] = [
  { id: 'desk', label: 'Desk' },
  { id: 'self', label: 'Self' },
  { id: 'cards', label: 'Cards' },
]

export function TopNav({
  state,
  onScreen,
  onNewCareer,
}: {
  state: GameState
  onScreen: (s: ScreenId) => void
  onNewCareer: () => void
}) {
  const character = CHARACTERS.find((c) => c.id === state.characterId)
  const grade = GRADES[state.grade]
  const locked = state.screen === 'review' || state.screen === 'event' || state.screen === 'promotion'

  function handleNewCareer() {
    const ok = window.confirm(
      'Start a new career? This clears your current save so you can pick the same character again or try another path.',
    )
    if (ok) onNewCareer()
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">Career Civics</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem' }}>
            {character?.name} · {grade.name}
          </div>
          <div className="muted" style={{ fontSize: '0.85rem', color: 'var(--mist)' }}>
            Career month {state.turn} · {state.reviewsDone} Review{state.reviewsDone === 1 ? '' : 's'} done
          </div>
        </div>
        <div className="topbar-actions">
          {!locked && (
            <div className="nav-pills" role="tablist" aria-label="Screens">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`nav-btn ${state.screen === tab.id ? 'active' : ''}`}
                  onClick={() => onScreen(tab.id)}
                  role="tab"
                  aria-selected={state.screen === tab.id}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
          <button className="btn btn-ghost nav-restart" type="button" onClick={handleNewCareer}>
            New career
          </button>
        </div>
      </div>
      <CareerLadderStrip state={state} />
    </>
  )
}
