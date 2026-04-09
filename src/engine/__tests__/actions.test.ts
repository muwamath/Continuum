import { describe, it, expect } from 'vitest'
import { canActionProceed, completeAction } from '../actions'
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
    state.inventory.wood.count = 10
    state.completedOneTimeActions = ['wooden-cart']
    expect(canActionProceed(woodenCart, state)).toBe(false)
  })

  it('blocks action when cannot afford costs', () => {
    const state = createInitialState()
    expect(canActionProceed(woodenCart, state)).toBe(false) // 0 wood, needs 10
  })

  it('allows action when can afford costs', () => {
    const state = createInitialState()
    state.inventory.wood.count = 10
    expect(canActionProceed(woodenCart, state)).toBe(true)
  })
})

describe('completeAction', () => {
  it('produces items', () => {
    const state = createInitialState()
    const result = completeAction(harvestBerries, state)
    expect(result.inventory.berry.count).toBe(1)
  })

  it('spends item costs', () => {
    const state = createInitialState()
    state.inventory.wood.count = 10
    const result = completeAction(woodenCart, state)
    expect(result.inventory.wood.count).toBe(0)
  })

  it('increases all capacities on bonus', () => {
    const state = createInitialState()
    state.inventory.wood.count = 10
    const result = completeAction(woodenCart, state)
    expect(result.inventory.berry.maxCapacity).toBe(15)
    expect(result.inventory.wood.maxCapacity).toBe(15)
  })

  it('marks one-time action as completed', () => {
    const state = createInitialState()
    state.inventory.wood.count = 10
    const result = completeAction(woodenCart, state)
    expect(result.completedOneTimeActions).toContain('wooden-cart')
  })

  it('does not mark repeating actions as completed', () => {
    const state = createInitialState()
    const result = completeAction(cutWood, state)
    expect(result.completedOneTimeActions).toHaveLength(0)
  })
})
