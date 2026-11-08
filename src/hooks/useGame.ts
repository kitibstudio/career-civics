import { useEffect, useReducer } from 'react'
import type { CharterBody, ClaimRole, GameState, ScreenId } from '../data/types'
import {
  attemptCharterReview,
  clearSave,
  continueAfterPromotion,
  createNewGame,
  endMonth,
  finishCharterReview,
  finishReview,
  loadGame,
  performAction,
  promote,
  resolveEventChoice,
  resolveEventClaim,
  resolveInbox,
  saveGame,
  setCharterBody,
  setScreen,
  toggleCard,
} from '../game/engine'

type Action =
  | { type: 'hydrate'; state: GameState | null }
  | { type: 'new'; characterId: string; charterBody?: CharterBody }
  | { type: 'screen'; screen: ScreenId }
  | { type: 'act'; actionId: string }
  | { type: 'endMonth' }
  | { type: 'toggleCard'; cardId: string }
  | { type: 'finishReview' }
  | { type: 'promote'; keepHabitId?: string }
  | { type: 'afterPromo' }
  | { type: 'event'; choiceId: string }
  | { type: 'eventClaim'; claim: ClaimRole }
  | { type: 'inbox'; defId: string; choiceId: string }
  | { type: 'charterBody'; body: CharterBody }
  | { type: 'charterReview' }
  | { type: 'finishCharterReview' }
  | { type: 'reset' }
  | { type: 'tipSeen' }

function reducer(state: GameState | null, action: Action): GameState | null {
  switch (action.type) {
    case 'hydrate':
      return action.state
    case 'new':
      return createNewGame(action.characterId, { charterBody: action.charterBody })
    case 'reset':
      clearSave()
      return null
    case 'screen':
      return state ? setScreen(state, action.screen) : state
    case 'act':
      return state ? performAction(state, action.actionId) : state
    case 'endMonth':
      return state ? endMonth(state) : state
    case 'toggleCard':
      return state ? toggleCard(state, action.cardId) : state
    case 'finishReview':
      return state ? finishReview(state) : state
    case 'promote':
      return state ? promote(state, action.keepHabitId) : state
    case 'afterPromo':
      return state ? continueAfterPromotion(state) : state
    case 'event':
      return state ? resolveEventChoice(state, action.choiceId) : state
    case 'eventClaim':
      return state ? resolveEventClaim(state, action.claim) : state
    case 'inbox':
      return state ? resolveInbox(state, action.defId, action.choiceId) : state
    case 'charterBody':
      return state ? setCharterBody(state, action.body) : state
    case 'charterReview':
      return state ? attemptCharterReview(state) : state
    case 'finishCharterReview':
      return state ? finishCharterReview(state) : state
    case 'tipSeen':
      return state ? { ...state, tipSeen: true } : state
    default:
      return state
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, null)

  useEffect(() => {
    dispatch({ type: 'hydrate', state: loadGame() })
  }, [])

  useEffect(() => {
    if (state) saveGame(state)
  }, [state])

  return { state, dispatch }
}
