import { describe, it, expect } from 'vitest'
import {
  canAddItem,
  addItem,
  removeItem,
  increaseAllCapacities,
} from '../inventory'
import type { InventoryItemState, ItemId } from '../types'

function makeInventory(
  berries = 0,
  wood = 0,
  cap = 10,
): Record<ItemId, InventoryItemState> {
  return {
    berry: { count: berries, maxCapacity: cap },
    wood: { count: wood, maxCapacity: cap },
  }
}

describe('canAddItem', () => {
  it('returns true when there is room', () => {
    expect(canAddItem(makeInventory(5), 'berry', 1)).toBe(true)
  })

  it('returns false when at capacity', () => {
    expect(canAddItem(makeInventory(10), 'berry', 1)).toBe(false)
  })

  it('returns false when adding would exceed capacity', () => {
    expect(canAddItem(makeInventory(8), 'berry', 5)).toBe(false)
  })
})

describe('addItem', () => {
  it('adds items', () => {
    const result = addItem(makeInventory(5), 'berry', 3)
    expect(result.berry.count).toBe(8)
  })

  it('clamps at max capacity', () => {
    const result = addItem(makeInventory(8), 'berry', 5)
    expect(result.berry.count).toBe(10)
  })

  it('does not mutate original', () => {
    const inv = makeInventory(5)
    addItem(inv, 'berry', 3)
    expect(inv.berry.count).toBe(5)
  })
})

describe('removeItem', () => {
  it('removes items', () => {
    const result = removeItem(makeInventory(5), 'berry', 3)
    expect(result.berry.count).toBe(2)
  })

  it('clamps at 0', () => {
    const result = removeItem(makeInventory(2), 'berry', 5)
    expect(result.berry.count).toBe(0)
  })
})

describe('increaseAllCapacities', () => {
  it('increases all item capacities', () => {
    const result = increaseAllCapacities(makeInventory(0, 0, 10), 5)
    expect(result.berry.maxCapacity).toBe(15)
    expect(result.wood.maxCapacity).toBe(15)
  })
})
