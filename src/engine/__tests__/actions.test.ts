import { describe, it, expect } from 'vitest'
import {
  canActionProceed,
  canActionAffordNextUnit,
  getRequiredCostsConsumed,
  tryConsumeNextUnit,
  completeAction,
} from '../actions'
import { createInitialState } from '../gameState'
import { actionDefinitions } from '../../data/actionDefinitions'

const harvestBerries = actionDefinitions.find((a) => a.id === 'harvest-berries')!
const cutWood = actionDefinitions.find((a) => a.id === 'cut-wood')!
const woodenCart = actionDefinitions.find((a) => a.id === 'wooden-cart')!

describe('canActionProceed', () => {
  it('allows action when inventory has room', () => {
    const state = createInitialState()
    expect(canActionProceed(harvestBerries, state)).toBe(true)
  })

  it('blocks action when inventory is full', () => {
    const state = createInitialState()
    state.inventory.berry.count = 10
    expect(canActionProceed(harvestBerries, state)).toBe(false)
  })

  it('blocks one-time action when already completed', () => {
    const state = createInitialState()
    state.completedOneTimeActions = ['wooden-cart']
    expect(canActionProceed(woodenCart, state)).toBe(false)
  })

  it('allows wooden cart regardless of wood count (costs are incremental)', () => {
    const state = createInitialState()
    // canActionProceed no longer checks costs — that's canActionAffordNextUnit
    expect(canActionProceed(woodenCart, state)).toBe(true)
  })
})

describe('getRequiredCostsConsumed', () => {
  // Wooden Cart: expCost=20, 10 wood → 2 exp per wood unit
  it('requires 1 unit consumed at progress=0', () => {
    expect(getRequiredCostsConsumed(woodenCart, 0)).toBe(1)
  })

  it('requires 1 unit consumed at progress=1.9', () => {
    expect(getRequiredCostsConsumed(woodenCart, 1.9)).toBe(1)
  })

  it('requires 2 units consumed at progress=2.0', () => {
    expect(getRequiredCostsConsumed(woodenCart, 2.0)).toBe(2)
  })

  it('requires 10 units consumed at progress=18', () => {
    expect(getRequiredCostsConsumed(woodenCart, 18)).toBe(10)
  })

  it('returns 0 for actions with no costs', () => {
    expect(getRequiredCostsConsumed(harvestBerries, 5)).toBe(0)
  })
})

describe('canActionAffordNextUnit', () => {
  it('allows if already consumed enough for current progress', () => {
    const state = createInitialState()
    const queued = { instanceId: '1', actionId: 'wooden-cart', progress: 0, costsConsumed: 1 }
    expect(canActionAffordNextUnit(woodenCart, state, queued)).toBe(true)
  })

  it('allows if wood is available to consume', () => {
    const state = createInitialState()
    state.inventory.wood.count = 1
    const queued = { instanceId: '1', actionId: 'wooden-cart', progress: 0, costsConsumed: 0 }
    expect(canActionAffordNextUnit(woodenCart, state, queued)).toBe(true)
  })

  it('blocks if no wood and none consumed yet', () => {
    const state = createInitialState()
    const queued = { instanceId: '1', actionId: 'wooden-cart', progress: 0, costsConsumed: 0 }
    expect(canActionAffordNextUnit(woodenCart, state, queued)).toBe(false)
  })

  it('always allows actions without costs', () => {
    const state = createInitialState()
    const queued = { instanceId: '1', actionId: 'harvest-berries', progress: 0, costsConsumed: 0 }
    expect(canActionAffordNextUnit(harvestBerries, state, queued)).toBe(true)
  })
})

describe('tryConsumeNextUnit', () => {
  it('consumes 1 wood from inventory', () => {
    const state = createInitialState()
    state.inventory.wood.count = 5
    const queued = { instanceId: '1', actionId: 'wooden-cart', progress: 0, costsConsumed: 0 }
    const result = tryConsumeNextUnit(woodenCart, state, queued)
    expect(result).not.toBeNull()
    expect(result!.inventory.wood.count).toBe(4)
  })

  it('returns null if no wood available', () => {
    const state = createInitialState()
    const queued = { instanceId: '1', actionId: 'wooden-cart', progress: 0, costsConsumed: 0 }
    expect(tryConsumeNextUnit(woodenCart, state, queued)).toBeNull()
  })
})

describe('completeAction', () => {
  it('produces items', () => {
    const state = createInitialState()
    const result = completeAction(harvestBerries, state)
    expect(result.inventory.berry.count).toBe(1)
  })

  it('does not spend costs (already consumed incrementally)', () => {
    const state = createInitialState()
    state.inventory.wood.count = 0 // already consumed during progress
    const result = completeAction(woodenCart, state)
    expect(result.inventory.wood.count).toBe(0)
  })

  it('increases all capacities on bonus', () => {
    const state = createInitialState()
    const result = completeAction(woodenCart, state)
    expect(result.inventory.berry.maxCapacity).toBe(15)
    expect(result.inventory.wood.maxCapacity).toBe(15)
  })

  it('marks one-time action as completed', () => {
    const state = createInitialState()
    const result = completeAction(woodenCart, state)
    expect(result.completedOneTimeActions).toContain('wooden-cart')
  })

  it('does not mark repeating actions as completed', () => {
    const state = createInitialState()
    const result = completeAction(cutWood, state)
    expect(result.completedOneTimeActions).toHaveLength(0)
  })
})
