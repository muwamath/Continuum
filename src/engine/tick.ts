import type { GameState } from './types'
import { actionDefinitions } from '../data/actionDefinitions'
import { skillDefinitions } from '../data/skillDefinitions'
import { addExp, getTotalMultiplierWithDefs } from './skills'
import {
  canActionProceed,
  canActionAffordNextUnit,
  getRequiredCostsConsumed,
  tryConsumeNextUnit,
  completeAction,
} from './actions'
import { removeFromQueue } from './queue'

export function processTick(state: GameState): GameState {
  if (state.isPaused || state.queue.length === 0) {
    return state
  }

  const current = state.queue[0]
  const actionDef = actionDefinitions.find((a) => a.id === current.actionId)
  if (!actionDef) {
    return {
      ...state,
      queue: removeFromQueue(state.queue, current.instanceId),
    }
  }

  // Check basic prerequisites (inventory full for produced item, one-time already done)
  if (!canActionProceed(actionDef, state)) {
    const newQueue = removeFromQueue(state.queue, current.instanceId)
    return {
      ...state,
      queue: newQueue,
      isPaused: newQueue.length === 0,
    }
  }

  // For actions with costs: ensure we can afford the next unit before progressing
  if (!canActionAffordNextUnit(actionDef, state, current)) {
    const newQueue = removeFromQueue(state.queue, current.instanceId)
    return {
      ...state,
      queue: newQueue,
      isPaused: newQueue.length === 0,
    }
  }

  // Consume cost units as needed before progressing
  let inventory = state.inventory
  let costsConsumed = current.costsConsumed
  const needed = getRequiredCostsConsumed(actionDef, current.progress)
  while (costsConsumed < needed) {
    const result = tryConsumeNextUnit(actionDef, { ...state, inventory }, {
      ...current,
      costsConsumed,
    })
    if (!result) break // can't afford — shouldn't happen since we checked above
    inventory = result.inventory
    costsConsumed++
  }

  const skillId = actionDef.requiredSkill
  const skillDef = skillDefinitions[skillId]
  const skill = state.skills[skillId]

  const totalMult = getTotalMultiplierWithDefs(
    skill,
    skillDef.coreMastery.multiplierPerLevel,
    skillDef.runMastery.multiplierPerLevel,
  )
  const tickExp = totalMult * 0.1

  // Award exp to both masteries
  const newCoreMastery = addExp(
    skill.coreMastery,
    skillDef.coreMastery.baseExp,
    tickExp,
  )
  const newRunMastery = addExp(
    skill.runMastery,
    skillDef.runMastery.baseExp,
    tickExp,
  )

  let newState: GameState = {
    ...state,
    inventory,
    skills: {
      ...state.skills,
      [skillId]: {
        ...skill,
        coreMastery: newCoreMastery,
        runMastery: newRunMastery,
      },
    },
    tickCount: state.tickCount + 1,
  }

  // Update progress
  const newProgress = current.progress + tickExp
  let newCostsConsumed = costsConsumed

  if (newProgress >= actionDef.expCost) {
    // Action completes
    newState = completeAction(actionDef, newState)

    if (actionDef.isOneTime) {
      newState = {
        ...newState,
        queue: removeFromQueue(newState.queue, current.instanceId),
      }
    } else {
      // Reset progress and costs for repeating actions
      const resetAction = { ...current, progress: 0, costsConsumed: 0 }
      newState = {
        ...newState,
        queue: [resetAction, ...newState.queue.slice(1)],
      }

      if (!canActionProceed(actionDef, newState)) {
        newState = {
          ...newState,
          queue: removeFromQueue(newState.queue, current.instanceId),
        }
      }
    }
  } else {
    // Check if we need to consume the next cost unit for the new progress level
    const newNeeded = getRequiredCostsConsumed(actionDef, newProgress)
    while (newCostsConsumed < newNeeded) {
      const result = tryConsumeNextUnit(actionDef, newState, {
        ...current,
        costsConsumed: newCostsConsumed,
      })
      if (!result) {
        // Can't afford next unit — stop here but keep progress so far
        break
      }
      newState = result
      newCostsConsumed++
    }

    // If we couldn't consume a needed unit, the action stalls — remove it
    if (newCostsConsumed < newNeeded) {
      newState = {
        ...newState,
        queue: removeFromQueue(newState.queue, current.instanceId),
      }
    } else {
      const updatedAction = {
        ...current,
        progress: newProgress,
        costsConsumed: newCostsConsumed,
      }
      newState = {
        ...newState,
        queue: [updatedAction, ...newState.queue.slice(1)],
      }
    }
  }

  // Auto-pause if queue is empty
  if (newState.queue.length === 0) {
    newState = { ...newState, isPaused: true }
  }

  return newState
}
