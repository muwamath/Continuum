import type { ActionDefinition, GameState } from './types'
import { canAddItem, canAfford, addItem, spendCosts, increaseAllCapacities } from './inventory'

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
  if (action.itemCosts && !canAfford(state.inventory, action.itemCosts)) {
    return false
  }
  return true
}

export function completeAction(
  action: ActionDefinition,
  state: GameState,
): GameState {
  let inventory = state.inventory
  let completedOneTimeActions = state.completedOneTimeActions

  if (action.itemCosts) {
    inventory = spendCosts(inventory, action.itemCosts)
  }

  if (action.producedItem && action.producedAmount) {
    inventory = addItem(inventory, action.producedItem, action.producedAmount)
  }

  if (action.capacityBonusOnComplete > 0) {
    inventory = increaseAllCapacities(inventory, action.capacityBonusOnComplete)
  }

  if (action.isOneTime) {
    completedOneTimeActions = [...completedOneTimeActions, action.id]
  }

  return {
    ...state,
    inventory,
    completedOneTimeActions,
  }
}
