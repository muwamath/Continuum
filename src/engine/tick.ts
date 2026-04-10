import type { GameState, ItemId, QueuedAction, ActionDefinition } from './types'
import { actionDefinitionMap } from '../data/actionDefinitions'
import { skillDefinitions } from '../data/skillDefinitions'
import { sceneDefinitions } from '../data/sceneDefinitions'
import { itemDefinitions } from '../data/itemDefinitions'
import { addExp, getTotalMultiplierWithDefs } from './skills'
import {
  canActionProceed,
  canActionAffordNextUnit,
  getRequiredCostsConsumed,
  getTotalCostUnits,
  tryConsumeNextUnit,
  completeAction,
} from './actions'
import { removeFromQueue, stalledRemoval, createQueuedAction } from './queue'
import {
  applyTickDamage,
  checkIsDead,
  calculateRebirthBonus,
  processAutoEat,
  tickCooldowns,
  getIronStomachMultiplier,
  TICKS_PER_MINUTE,
} from './health'
import { getAutomatedActions, getFoodAsNeededRefill, getFoodAsNeededTopUp } from './automation'

const TICKS_PER_SKILL_POINT = TICKS_PER_MINUTE * 15 // 1 point per 15 minutes of run time

function tryFillAutomationQueue(state: GameState): GameState {
  // 1. Urgent: any food at 0 with an AN producer.
  const foodRefill = getFoodAsNeededRefill(state)
  if (foodRefill) {
    return { ...state, queue: [foodRefill] }
  }
  // 2. Passive automation (priorities 1–5).
  const scene = sceneDefinitions[state.currentSceneId]
  if (scene) {
    const automated = getAutomatedActions(state, scene.actionIds, state.stalledActionProgress)
    if (automated.length > 0) {
      return { ...state, queue: automated.slice(0, 1) }
    }
  }
  // 3. Fallback: top off any AN food that's below max capacity.
  const topUp = getFoodAsNeededTopUp(state)
  if (topUp) {
    return { ...state, queue: [topUp] }
  }
  return { ...state, isPaused: true }
}

/** Find an AN producer in the current scene that produces the given item. */
function findAsNeededProducer(state: GameState, itemId: ItemId): ActionDefinition | null {
  const scene = sceneDefinitions[state.currentSceneId]
  if (!scene) return null
  for (const id of scene.actionIds) {
    if (!state.asNeededActions[id]) continue
    const def = actionDefinitionMap.get(id)
    if (!def || def.producedItem !== itemId) continue
    if (def.isOneTime && state.completedOneTimeActions.includes(id)) continue
    return def
  }
  return null
}

/**
 * Try to inject an AN producer for the consuming action's missing material.
 * Returns the new queue with the producer at the front and the consumer at position 1
 * (with its updated progress/costsConsumed), or null if no AN producer applies.
 */
function tryInjectMaterialAN(
  state: GameState,
  consumer: QueuedAction,
  consumerDef: ActionDefinition,
  newProgress: number,
  newCostsConsumed: number,
): QueuedAction[] | null {
  if (!consumerDef.itemCosts || consumerDef.itemCosts.length === 0) return null

  // Find which cost entry can't be afforded
  let unitsRemaining = newCostsConsumed
  for (const cost of consumerDef.itemCosts) {
    if (unitsRemaining < cost.amount) {
      // This is the cost we're stuck on
      const producer = findAsNeededProducer(state, cost.itemId)
      if (!producer || !producer.producedAmount) return null

      const totalUnits = getTotalCostUnits(consumerDef)
      const stillNeeded = totalUnits - newCostsConsumed
      const haveInInventory = state.inventory[cost.itemId].count
      const mustGather = Math.max(0, stillNeeded - haveInInventory)
      if (mustGather === 0) return null
      const cycles = Math.ceil(mustGather / producer.producedAmount)

      const updatedConsumer: QueuedAction = {
        ...consumer,
        progress: newProgress,
        costsConsumed: newCostsConsumed,
      }
      const producerQueued = createQueuedAction(producer.id, undefined, cycles)
      // Replace the consumer at front with [producer, consumer, ...rest]
      return [producerQueued, updatedConsumer, ...state.queue.slice(1)]
    }
    unitsRemaining -= cost.amount
  }
  return null
}

/** Inject an AN producer for a depleted food item at the front of the queue. */
function tryInjectFoodAN(state: GameState, foodId: ItemId): GameState {
  const producer = findAsNeededProducer(state, foodId)
  if (!producer || !producer.producedAmount) return state
  const cap = state.inventory[foodId].maxCapacity
  const cycles = Math.max(1, Math.ceil(cap / producer.producedAmount))
  // Avoid stacking duplicates: if the front already is this producer, skip
  if (state.queue.length > 0 && state.queue[0].actionId === producer.id) return state
  const producerQueued = createQueuedAction(producer.id, undefined, cycles)
  return { ...state, queue: [producerQueued, ...state.queue] }
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
    // Try AN injection first
    const injected = tryInjectMaterialAN(state, current, actionDef, current.progress, current.costsConsumed)
    if (injected) {
      return { ...state, queue: injected }
    }
    const result = stalledRemoval(state.queue, current.instanceId, state.stalledActionProgress)
    const stalledState = { ...state, ...result }
    if (result.queue.length === 0) {
      return tryFillAutomationQueue(stalledState)
    }
    return stalledState
  }

  // Health: apply damage (with ironStomach perk applied), auto-eat, death check
  const effectiveDecayMultiplier = state.healthDecayMultiplier * getIronStomachMultiplier(state.perks)
  const newHealthCurrent = applyTickDamage(state.health.current, state.runTickCount, effectiveDecayMultiplier)
  const newCooldowns = tickCooldowns(state.foodCooldowns)

  const newRunTickCount = state.runTickCount + 1

  // Skill points: award 1 each time we cross a TICKS_PER_SKILL_POINT boundary in this run
  let nextSkillPoints = state.skillPoints
  if (Math.floor(newRunTickCount / TICKS_PER_SKILL_POINT) > Math.floor(state.runTickCount / TICKS_PER_SKILL_POINT)) {
    nextSkillPoints = state.skillPoints + 1
  }

  let healthState: GameState = {
    ...state,
    health: { ...state.health, current: newHealthCurrent },
    foodCooldowns: newCooldowns,
    runTickCount: newRunTickCount,
    skillPoints: nextSkillPoints,
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
    } else if (current.targetCount !== undefined) {
      // Targeted finite run — decrement and remove when zero
      const remaining = current.targetCount - 1
      if (remaining <= 0) {
        newState = {
          ...newState,
          queue: removeFromQueue(newState.queue, current.instanceId),
        }
      } else {
        const resetAction: QueuedAction = {
          ...current,
          progress: 0,
          costsConsumed: 0,
          targetCount: remaining,
        }
        newState = {
          ...newState,
          queue: [resetAction, ...newState.queue.slice(1)],
        }
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

    // If we couldn't consume a needed unit, the action stalls
    if (newCostsConsumed < newNeeded) {
      // Try AN injection first
      const injected = tryInjectMaterialAN(newState, current, actionDef, newProgress, newCostsConsumed)
      if (injected) {
        newState = { ...newState, queue: injected }
      } else {
        const result = stalledRemoval(newState.queue, current.instanceId, newState.stalledActionProgress)
        newState = { ...newState, ...result }
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

  // Auto-fill from automation if queue is empty
  if (newState.queue.length === 0) {
    newState = tryFillAutomationQueue(newState)
  }

  // Food depletion trigger: if any food item hit 0 this tick, try AN injection then automation refill
  if (newState.queue.length > 0) {
    for (const def of Object.values(itemDefinitions)) {
      if (def.category !== 'food') continue
      const id = def.id as ItemId
      if (newState.inventory[id].count === 0 && state.inventory[id].count > 0) {
        const before = newState
        newState = tryInjectFoodAN(newState, id)
        if (newState === before) {
          // No AN producer for this food — fall back to passive automation refill
          newState = tryFillAutomationQueue(newState)
        }
      }
    }
  }

  return newState
}
