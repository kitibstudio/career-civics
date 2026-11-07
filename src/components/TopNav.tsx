import type { GameState, ScreenId } from '../data/types'
import { GRADES } from '../data/grades'
import { CHARACTERS } from '../data/characters'

const TABS: { id: ScreenId; label: string }[] = [
  { id: 'desk', label: 'Desk' },
  { id: 'self', label: 'Self' },
  { id: 'cards', label: 'Cards' },
]

export function TopNav({
  state,
  onScreen,
}: {
  state: GameState
  onScreen: (s: ScreenId) => void
}) {
  const character = CHARACTERS.find((c) => c.id === state.characterId)
  const grade = GRADES[state.grade]
  const locked = state.screen === 'review' || state.screen === 'event' || state.screen === 'promotion'

  return (
    <div className="topbar">
      <div>
        <div className="eyebrow">Career Civics</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem' }}>
          {character?.name} · {grade.name}
        </div>
        <div className="muted" style={{ fontSize: '0.85rem', color: 'var(--mist)' }}>
          Month {state.turn} · Review {(Math.floor((state.monthInGrade - 1) / 6) % 10) + 1} in grade
        </div>
      </div>
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
    </div>
  )
}
