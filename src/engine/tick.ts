import type { GameState, ItemId } from './types'
import { actionDefinitionMap } from '../data/actionDefinitions'
import { skillDefinitions } from '../data/skillDefinitions'
import { sceneDefinitions } from '../data/sceneDefinitions'
import { itemDefinitions } from '../data/itemDefinitions'
import { addExp, getTotalMultiplierWithDefs } from './skills'
import {
  canActionProceed,
  canActionAffordNextUnit,
  getRequiredCostsConsumed,
  tryConsumeNextUnit,
  completeAction,
} from './actions'
import { removeFromQueue, stalledRemoval } from './queue'
import {
  applyTickDamage,
  checkIsDead,
  calculateRebirthBonus,
  processAutoEat,
  tickCooldowns,
} from './health'
import { getAutomatedActions } from './automation'

function tryFillAutomationQueue(state: GameState): GameState {
  const scene = sceneDefinitions[state.currentSceneId]
  if (!scene) return { ...state, isPaused: true }
  const automated = getAutomatedActions(state, scene.actionIds, state.stalledActionProgress)
  if (automated.length > 0) {
    return { ...state, queue: automated }
  }
  return { ...state, isPaused: true }
}

export function processTick(state: GameState): GameState {
  if (state.isPaused || state.isDead || state.queue.length === 0) {
    return state
  }

  // Validate front action BEFORE applying damage or progressing time
  const current = state.queue[0]
  const actionDef = actionDefinitionMap.get(current.actionId)
  if (!actionDef) {
    return {
      ...state,
      queue: removeFromQueue(state.queue, current.instanceId),
    }
  }

  // Check basic prerequisites (inventory full for produced item, one-time already done)
  if (!canActionProceed(actionDef, state)) {
    const newQueue = removeFromQueue(state.queue, current.instanceId)
    if (newQueue.length === 0) {
      return tryFillAutomationQueue({ ...state, queue: newQueue })
    }
    return { ...state, queue: newQueue }
  }

  // For actions with costs: ensure we can afford the next unit before progressing
  if (!canActionAffordNextUnit(actionDef, state, current)) {
    const result = stalledRemoval(state.queue, current.instanceId, state.stalledActionProgress)
    const stalledState = { ...state, ...result }
    if (result.queue.length === 0) {
      return tryFillAutomationQueue(stalledState)
    }
    return stalledState
  }

  // Health: apply damage, auto-eat, death check
  const newHealthCurrent = applyTickDamage(state.health.current, state.runTickCount, state.healthDecayMultiplier)
  const newCooldowns = tickCooldowns(state.foodCooldowns)

  let healthState: GameState = {
    ...state,
    health: { ...state.health, current: newHealthCurrent },
    foodCooldowns: newCooldowns,
    runTickCount: state.runTickCount + 1,
  }

  // Auto-eat before death check
  healthState = processAutoEat(healthState)

  // Death check
  if (checkIsDead(healthState.health.current)) {
    const bonus = calculateRebirthBonus(healthState.runTickCount)
    return {
      ...healthState,
      isDead: true,
      pendingRebirthBonus: bonus,
      isPaused: true,
    }
  }

  state = healthState

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

    // If we couldn't consume a needed unit, the action stalls — save progress and remove it
    if (newCostsConsumed < newNeeded) {
      const result = stalledRemoval(newState.queue, current.instanceId, newState.stalledActionProgress)
      newState = { ...newState, ...result }
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

  // Auto-fill from automation if queue is empty
  if (newState.queue.length === 0) {
    newState = tryFillAutomationQueue(newState)
  }

  // Food depletion trigger: if any food item hit 0 this tick, try automation refill
  if (newState.queue.length > 0) {
    const foodDepleted = Object.values(itemDefinitions).some(
      (def) => def.category === 'food' &&
        newState.inventory[def.id as ItemId].count === 0 &&
        state.inventory[def.id as ItemId].count > 0,
    )
    if (foodDepleted) {
      newState = tryFillAutomationQueue(newState)
    }
  }

  return newState
}
