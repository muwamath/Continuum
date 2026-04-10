import { useReducer } from 'react'
import type { GameState, QueuedAction } from '../engine/types'
import { createInitialState } from '../engine/gameState'
import { processTick } from '../engine/tick'
import { enqueueFront, enqueueBack, stalledRemoval } from '../engine/queue'
import { performRebirth } from '../engine/health'
import { getAutomatedActions } from '../engine/automation'
import { sceneDefinitions } from '../data/sceneDefinitions'

export type GameAction =
  | { type: 'TICK' }
  | { type: 'ENQUEUE_FRONT'; action: QueuedAction }
  | { type: 'ENQUEUE_BACK'; action: QueuedAction }
  | { type: 'REMOVE_FROM_QUEUE'; instanceId: string }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'SET_DEBUG_STATE'; state: Partial<GameState> }
  | { type: 'RESTART' }
  | { type: 'CONTINUE_REBIRTH' }
  | { type: 'SET_AUTOMATION_PRIORITY'; actionId: string; priority: number }

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TICK':
      return processTick(state)

    case 'ENQUEUE_FRONT': {
      const saved = state.stalledActionProgress[action.action.actionId]
      const restoredAction = saved
        ? { ...action.action, progress: saved.progress, costsConsumed: saved.costsConsumed }
        : action.action
      const { [action.action.actionId]: _, ...remainingStalled } = state.stalledActionProgress
      return {
        ...state,
        queue: enqueueFront(state.queue, restoredAction),
        stalledActionProgress: saved ? remainingStalled : state.stalledActionProgress,
        isPaused: false,
        pausedByUser: false,
      }
    }

    case 'ENQUEUE_BACK': {
      const saved = state.stalledActionProgress[action.action.actionId]
      const restoredAction = saved
        ? { ...action.action, progress: saved.progress, costsConsumed: saved.costsConsumed }
        : action.action
      const { [action.action.actionId]: _, ...remainingStalled } = state.stalledActionProgress
      return {
        ...state,
        queue: enqueueBack(state.queue, restoredAction),
        stalledActionProgress: saved ? remainingStalled : state.stalledActionProgress,
        isPaused: false,
        pausedByUser: false,
      }
    }

    case 'TOGGLE_PAUSE': {
      if (state.isDead) return state
      if (state.isPaused && state.queue.length === 0) return state
      const willPause = !state.isPaused
      return {
        ...state,
        isPaused: willPause,
        pausedByUser: willPause,
      }
    }

    case 'REMOVE_FROM_QUEUE': {
      const result = stalledRemoval(state.queue, action.instanceId, state.stalledActionProgress)
      return {
        ...state,
        ...result,
        isPaused: result.queue.length === 0,
      }
    }

    case 'SET_DEBUG_STATE':
      return { ...state, ...action.state }

    case 'CONTINUE_REBIRTH': {
      const reborn = performRebirth(state)
      const scene = sceneDefinitions[reborn.currentSceneId]
      if (scene) {
        const automated = getAutomatedActions(reborn, scene.actionIds, reborn.stalledActionProgress)
        if (automated.length > 0) {
          return { ...reborn, queue: automated, isPaused: false }
        }
      }
      return reborn
    }

    case 'SET_AUTOMATION_PRIORITY': {
      const newSettings = { ...state.automationSettings }
      if (action.priority === 0) {
        delete newSettings[action.actionId]
      } else {
        newSettings[action.actionId] = action.priority
      }
      const newState = { ...state, automationSettings: newSettings }
      if (newState.queue.length === 0 && !newState.isDead) {
        const scene = sceneDefinitions[newState.currentSceneId]
        if (scene) {
          const automated = getAutomatedActions(newState, scene.actionIds, newState.stalledActionProgress)
          if (automated.length > 0) {
            return { ...newState, queue: automated, isPaused: false, pausedByUser: false }
          }
        }
      }
      return newState
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
