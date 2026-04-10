import { useReducer } from 'react'
import type { GameState, QueuedAction, PerkState } from '../engine/types'
import { createInitialState } from '../engine/gameState'
import { processTick } from '../engine/tick'
import { enqueueFront, enqueueBack, stalledRemoval } from '../engine/queue'
import { performRebirth } from '../engine/health'
import { getAutomatedActions, getFoodAsNeededRefill, getFoodAsNeededTopUp } from '../engine/automation'
import { sceneDefinitions } from '../data/sceneDefinitions'

/**
 * Pick the next action to run when the queue is empty. Priority order:
 *   1. Food at 0 with AN producer (urgent refill)
 *   2. Highest passive automation priority
 *   3. Food below max with AN producer (top-up fallback when nothing else applies)
 * Returns null if there's nothing to do.
 */
function pickNextQueueAction(state: GameState): QueuedAction | null {
  const refill = getFoodAsNeededRefill(state)
  if (refill) return refill
  const scene = sceneDefinitions[state.currentSceneId]
  if (scene) {
    const automated = getAutomatedActions(state, scene.actionIds, state.stalledActionProgress)
    if (automated.length > 0) return automated[0]
  }
  return getFoodAsNeededTopUp(state)
}

export type GameAction =
  | { type: 'TICK' }
  | { type: 'ENQUEUE_FRONT'; action: QueuedAction }
  | { type: 'ENQUEUE_BACK'; action: QueuedAction }
  | { type: 'REMOVE_FROM_QUEUE'; instanceId: string }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'AUTO_FILL_QUEUE' }
  | { type: 'SET_DEBUG_STATE'; state: Partial<GameState> }
  | { type: 'RESTART' }
  | { type: 'CONTINUE_REBIRTH'; allocations?: PerkState }
  | { type: 'SET_AUTOMATION_PRIORITY'; actionId: string; priority: number | 'AN' }

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
      // Unpausing with empty queue: pick the next thing to do; stay paused if nothing applies
      if (state.isPaused && state.queue.length === 0) {
        const action = pickNextQueueAction(state)
        if (!action) return state
        return { ...state, queue: [action], isPaused: false, pausedByUser: false }
      }
      const willPause = !state.isPaused
      return {
        ...state,
        isPaused: willPause,
        pausedByUser: willPause,
      }
    }

    case 'AUTO_FILL_QUEUE': {
      // Automatic background fill — does NOT override an explicit user pause.
      if (state.isDead || state.queue.length > 0 || state.pausedByUser) return state
      const action = pickNextQueueAction(state)
      if (!action) return state
      return { ...state, queue: [action], isPaused: false }
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
      // Apply perk allocations from the death screen (clamped to available points)
      let working = state
      if (action.allocations) {
        const requested =
          (action.allocations.ironStomach ?? 0) +
          (action.allocations.quickLearner ?? 0) +
          (action.allocations.heartyMeals ?? 0)
        const available = working.skillPoints
        if (requested > 0 && available > 0) {
          // If they asked for more than available, scale proportionally to never overspend
          const spendable = Math.min(requested, available)
          const scale = spendable / requested
          const ironStomachAdd = Math.floor((action.allocations.ironStomach ?? 0) * scale)
          const quickLearnerAdd = Math.floor((action.allocations.quickLearner ?? 0) * scale)
          const heartyMealsAdd = Math.floor((action.allocations.heartyMeals ?? 0) * scale)
          const totalSpent = ironStomachAdd + quickLearnerAdd + heartyMealsAdd
          working = {
            ...working,
            skillPoints: working.skillPoints - totalSpent,
            perks: {
              ironStomach: working.perks.ironStomach + ironStomachAdd,
              quickLearner: working.perks.quickLearner + quickLearnerAdd,
              heartyMeals: working.perks.heartyMeals + heartyMealsAdd,
            },
          }
        }
      }
      const reborn = performRebirth(working)
      const next = pickNextQueueAction(reborn)
      if (next) {
        return { ...reborn, queue: [next], isPaused: false }
      }
      return reborn
    }

    case 'SET_AUTOMATION_PRIORITY': {
      const newSettings = { ...state.automationSettings }
      const newAsNeeded = { ...state.asNeededActions }
      if (action.priority === 'AN') {
        delete newSettings[action.actionId]
        newAsNeeded[action.actionId] = true
      } else if (action.priority === 0) {
        delete newSettings[action.actionId]
        delete newAsNeeded[action.actionId]
      } else {
        newSettings[action.actionId] = action.priority
        delete newAsNeeded[action.actionId]
      }
      const newState = { ...state, automationSettings: newSettings, asNeededActions: newAsNeeded }
      if (newState.queue.length === 0 && !newState.isDead && !newState.pausedByUser) {
        const next = pickNextQueueAction(newState)
        if (next) {
          return { ...newState, queue: [next], isPaused: false }
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
