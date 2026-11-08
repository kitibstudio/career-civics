import { useMemo, useState } from 'react'
import { TopNav } from './components/TopNav'
import { useGame } from './hooks/useGame'
import { CharacterScreen } from './screens/CharacterScreen'
import { CardsScreen } from './screens/CardsScreen'
import { DeskScreen } from './screens/DeskScreen'
import { EventScreen } from './screens/EventScreen'
import { PromotionScreen } from './screens/PromotionScreen'
import { ReviewScreen } from './screens/ReviewScreen'
import { SelfScreen } from './screens/SelfScreen'
import { TitleScreen } from './screens/TitleScreen'
import { WinScreen } from './screens/WinScreen'
import type { ScreenId } from './data/types'

export default function App() {
  const { state, dispatch } = useGame()
  const [picking, setPicking] = useState(false)
  const hasSave = !!state

  const screen: ScreenId | 'title' | 'character' = useMemo(() => {
    if (picking) return 'character'
    if (!state) return 'title'
    return state.screen
  }, [picking, state])

  return (
    <div className="app-shell">
      <div className="blueprint-grid" aria-hidden />
      {state && screen !== 'title' && screen !== 'character' && screen !== 'win' && (
        <div className="screen" style={{ paddingBottom: 0 }}>
          <TopNav
            state={state}
            onScreen={(s) => dispatch({ type: 'screen', screen: s })}
            onNewCareer={() => {
              dispatch({ type: 'reset' })
              setPicking(true)
            }}
          />
        </div>
      )}

      {screen === 'title' && (
        <TitleScreen
          hasSave={hasSave && !!state && !state.ended}
          onStart={() => {
            dispatch({ type: 'reset' })
            setPicking(true)
          }}
          onContinue={() => {
            if (state?.ended) {
              dispatch({ type: 'reset' })
              setPicking(true)
            } else if (state) {
              dispatch({ type: 'screen', screen: 'desk' })
            }
          }}
        />
      )}

      {screen === 'character' && (
        <CharacterScreen
          onBack={() => setPicking(false)}
          onPick={(id) => {
            setPicking(false)
            dispatch({ type: 'new', characterId: id })
          }}
        />
      )}

      {state && screen === 'desk' && (
        <DeskScreen
          state={state}
          onAction={(id) => dispatch({ type: 'act', actionId: id })}
          onInbox={(defId, choiceId) => dispatch({ type: 'inbox', defId, choiceId })}
          onEndMonth={() => dispatch({ type: 'endMonth' })}
          onDismissTip={() => dispatch({ type: 'tipSeen' })}
        />
      )}

      {state && screen === 'self' && (
        <SelfScreen
          state={state}
          onAskFeedback={() => dispatch({ type: 'act', actionId: 'ask-feedback' })}
          onPlanGaps={() => dispatch({ type: 'screen', screen: 'desk' })}
        />
      )}

      {state && screen === 'cards' && (
        <CardsScreen
          state={state}
          onToggle={(id) => dispatch({ type: 'toggleCard', cardId: id })}
          onDone={() => dispatch({ type: 'screen', screen: 'desk' })}
        />
      )}

      {state && screen === 'review' && (
        <ReviewScreen state={state} onContinue={() => dispatch({ type: 'finishReview' })} />
      )}

      {state && screen === 'promotion' && (
        <PromotionScreen
          state={state}
          onPromote={(keep) => dispatch({ type: 'promote', keepHabitId: keep })}
          onContinue={() => dispatch({ type: 'afterPromo' })}
        />
      )}

      {state && screen === 'event' && (
        <EventScreen state={state} onChoose={(id) => dispatch({ type: 'event', choiceId: id })} />
      )}

      {state && screen === 'win' && (
        <WinScreen
          state={state}
          onRestart={() => {
            dispatch({ type: 'reset' })
            setPicking(true)
          }}
        />
      )}
    </div>
  )
}
