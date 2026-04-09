import type { InventoryItemState, ItemId } from './types'

type InventoryState = Record<ItemId, InventoryItemState>

export function canAddItem(
  inventory: InventoryState,
  itemId: ItemId,
  amount: number,
): boolean {
  const item = inventory[itemId]
  return item.count + amount <= item.maxCapacity
}

export function addItem(
  inventory: InventoryState,
  itemId: ItemId,
  amount: number,
): InventoryState {
  const item = inventory[itemId]
  const newCount = Math.min(item.count + amount, item.maxCapacity)
  return {
    ...inventory,
    [itemId]: { ...item, count: newCount },
  }
}

export function removeItem(
  inventory: InventoryState,
  itemId: ItemId,
  amount: number,
): InventoryState {
  const item = inventory[itemId]
  const newCount = Math.max(item.count - amount, 0)
  return {
    ...inventory,
    [itemId]: { ...item, count: newCount },
  }
}

export function increaseAllCapacities(
  inventory: InventoryState,
  amount: number,
): InventoryState {
  const result = { ...inventory }
  for (const key of Object.keys(result) as ItemId[]) {
    result[key] = {
      ...result[key],
      maxCapacity: result[key].maxCapacity + amount,
    }
  }
  return result
}
