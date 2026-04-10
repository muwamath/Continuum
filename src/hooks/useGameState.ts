import { useReducer } from 'react'
import type { GameState, QueuedAction } from '../engine/types'
import { createInitialState } from '../engine/gameState'
import { processTick } from '../engine/tick'
import { enqueueFront, enqueueBack, removeFromQueue } from '../engine/queue'
import { performRebirth } from '../engine/health'

export type GameAction =
  | { type: 'TICK' }
  | { type: 'ENQUEUE_FRONT'; action: QueuedAction }
  | { type: 'ENQUEUE_BACK'; action: QueuedAction }
  | { type: 'REMOVE_FROM_QUEUE'; instanceId: string }
  | { type: 'SET_DEBUG_STATE'; state: Partial<GameState> }
  | { type: 'RESTART' }
  | { type: 'CONTINUE_REBIRTH' }
  | { type: 'SET_AUTOMATION_PRIORITY'; actionId: string; priority: number }

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TICK':
      return processTick(state)

    case 'ENQUEUE_FRONT':
      return {
        ...state,
        queue: enqueueFront(state.queue, action.action),
        isPaused: false,
      }

    case 'ENQUEUE_BACK':
      return {
        ...state,
        queue: enqueueBack(state.queue, action.action),
        isPaused: false,
      }

    case 'REMOVE_FROM_QUEUE': {
      const newQueue = removeFromQueue(state.queue, action.instanceId)
      return {
        ...state,
        queue: newQueue,
        isPaused: newQueue.length === 0,
      }
    }

    case 'SET_DEBUG_STATE':
      return { ...state, ...action.state }

    case 'CONTINUE_REBIRTH':
      return performRebirth(state)

    case 'SET_AUTOMATION_PRIORITY': {
      const newSettings = { ...state.automationSettings }
      if (action.priority === 0) {
        delete newSettings[action.actionId]
      } else {
        newSettings[action.actionId] = action.priority
      }
      return { ...state, automationSettings: newSettings }
    }

    case 'RESTART':
      localStorage.removeItem('continuum-save')
      return createInitialState()

    default:
      return state
  }
}

export function useGameState() {
  return useReducer(gameReducer, undefined, createInitialState)
}
