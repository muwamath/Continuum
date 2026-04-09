import type { ActionDefinition, GameState, QueuedAction } from './types'
import { canAddItem, addItem, removeItem, increaseAllCapacities } from './inventory'

/**
 * Get the total number of cost units for an action.
 * E.g., Wooden Cart needs [{itemId: 'wood', amount: 10}] → 10 total units.
 * For simplicity, actions currently have at most one cost entry.
 */
export function getTotalCostUnits(action: ActionDefinition): number {
  if (!action.itemCosts || action.itemCosts.length === 0) return 0
  return action.itemCosts.reduce((sum, c) => sum + c.amount, 0)
}

/**
 * How many cost units must be consumed to allow progress up to a given point.
 * Costs are consumed incrementally: 1 unit per chunk of (expCost / totalUnits) progress.
 * The first unit is consumed at progress=0 (to start), then another each time
 * progress crosses the next threshold.
 */
export function getRequiredCostsConsumed(
  action: ActionDefinition,
  progress: number,
): number {
  const totalUnits = getTotalCostUnits(action)
  if (totalUnits === 0) return 0
  const expPerUnit = action.expCost / totalUnits
  // At progress=0, need 1 consumed to start. At progress=expPerUnit, need 2, etc.
  return Math.min(totalUnits, Math.floor(progress / expPerUnit) + 1)
}

/**
 * Try to consume the next cost unit from inventory.
 * Returns the updated inventory, or null if we can't afford it.
 */
export function tryConsumeNextUnit(
  action: ActionDefinition,
  state: GameState,
  queued: QueuedAction,
): GameState | null {
  if (!action.itemCosts || action.itemCosts.length === 0) return state

  const totalUnits = getTotalCostUnits(action)
  if (queued.costsConsumed >= totalUnits) return state // all consumed already

  // Determine which cost entry and how much to take.
  // Walk through costs in order, consuming from each.
  let unitsRemaining = queued.costsConsumed
  for (const cost of action.itemCosts) {
    if (unitsRemaining < cost.amount) {
      // This is the cost entry we need to consume from next
      if (state.inventory[cost.itemId].count < 1) {
        return null // can't afford
      }
      return {
        ...state,
        inventory: removeItem(state.inventory, cost.itemId, 1),
      }
    }
    unitsRemaining -= cost.amount
  }
  return state
}

/**
 * Check if an action can start or continue (ignoring cost consumption, which is handled incrementally).
 * For actions with no costs: check produced item capacity.
 * For one-time actions: check not already completed.
 */
export function canActionProceed(
  action: ActionDefinition,
  state: GameState,
): boolean {
  if (action.isOneTime && state.completedOneTimeActions.includes(action.id)) {
    return false
  }
  if (action.producedItem && action.producedAmount) {
    if (!canAddItem(state.inventory, action.producedItem, action.producedAmount)) {
      return false
    }
  }
  return true
}

/**
 * Check if an action with costs has at least 1 unit of its cost material available
 * OR has already consumed enough to continue progressing.
 */
export function canActionAffordNextUnit(
  action: ActionDefinition,
  state: GameState,
  queued: QueuedAction,
): boolean {
  const totalUnits = getTotalCostUnits(action)
  if (totalUnits === 0) return true // no costs
  if (queued.costsConsumed >= totalUnits) return true // all already consumed

  const needed = getRequiredCostsConsumed(action, queued.progress)
  if (queued.costsConsumed >= needed) return true // enough consumed for current progress

  // Need to consume another unit — check if available
  return tryConsumeNextUnit(action, state, queued) !== null
}

/**
 * Complete an action: produce items, apply capacity bonus, mark one-time.
 * Costs have already been consumed incrementally, so we don't spend them here.
 */
export function completeAction(
  action: ActionDefinition,
  state: GameState,
): GameState {
  let inventory = state.inventory
  let completedOneTimeActions = state.completedOneTimeActions

  // Costs already consumed incrementally — no spendCosts here

  if (action.producedItem && action.producedAmount) {
    inventory = addItem(inventory, action.producedItem, action.producedAmount)
  }

  if (action.capacityBonusOnComplete > 0) {
    inventory = increaseAllCapacities(inventory, action.capacityBonusOnComplete)
  }

  if (action.isOneTime) {
    completedOneTimeActions = [...completedOneTimeActions, action.id]
  }

  let healthDecayMultiplier = state.healthDecayMultiplier
  if (action.healthDecayMultiplier !== undefined) {
    healthDecayMultiplier *= action.healthDecayMultiplier
  }

  return {
    ...state,
    inventory,
    completedOneTimeActions,
    healthDecayMultiplier,
  }
}
