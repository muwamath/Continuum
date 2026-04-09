import { useReducer } from 'react'
import type { GameState, QueuedAction } from '../engine/types'
import { createInitialState } from '../engine/gameState'
import { processTick } from '../engine/tick'
import { enqueueFront, enqueueBack, removeFromQueue } from '../engine/queue'

export type GameAction =
  | { type: 'TICK' }
  | { type: 'ENQUEUE_FRONT'; action: QueuedAction }
  | { type: 'ENQUEUE_BACK'; action: QueuedAction }
  | { type: 'REMOVE_FROM_QUEUE'; instanceId: string }
  | { type: 'SET_DEBUG_STATE'; state: Partial<GameState> }

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

    default:
      return state
  }
}

export function useGameState() {
  return useReducer(gameReducer, undefined, createInitialState)
}
