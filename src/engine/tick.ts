import type { GameState } from './types'
import { actionDefinitions } from '../data/actionDefinitions'
import { skillDefinitions } from '../data/skillDefinitions'
import { addExp, getTotalMultiplierWithDefs } from './skills'
import { canActionProceed, completeAction } from './actions'
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
  if (newProgress >= actionDef.expCost) {
    // Check if the action can actually complete (enough items to pay costs, etc.)
    if (!canActionProceed(actionDef, newState)) {
      // Can't afford costs or inventory full — skip this action
      newState = {
        ...newState,
        queue: removeFromQueue(newState.queue, current.instanceId),
      }
    } else {
      // Action completes
      newState = completeAction(actionDef, newState)

      if (actionDef.isOneTime) {
        // Remove one-time action from queue
        newState = {
          ...newState,
          queue: removeFromQueue(newState.queue, current.instanceId),
        }
      } else {
        // Reset progress for repeating actions
        const resetAction = { ...current, progress: 0 }
        newState = {
          ...newState,
          queue: [resetAction, ...newState.queue.slice(1)],
        }

        // Check if the action can proceed again (inventory full, etc.)
        if (!canActionProceed(actionDef, newState)) {
          newState = {
            ...newState,
            queue: removeFromQueue(newState.queue, current.instanceId),
          }
        }
      }
    }
  } else {
    // Action still in progress
    const updatedAction = { ...current, progress: newProgress }
    newState = {
      ...newState,
      queue: [updatedAction, ...newState.queue.slice(1)],
    }
  }

  // Auto-pause if queue is empty
  if (newState.queue.length === 0) {
    newState = { ...newState, isPaused: true }
  }

  return newState
}
