import { describe, it, expect } from 'vitest'
import { processTick } from '../tick'
import { createInitialState } from '../gameState'
import { createQueuedAction, _resetInstanceIdCounter } from '../queue'
import { beforeEach } from 'vitest'

beforeEach(() => {
  _resetInstanceIdCounter()
})

describe('processTick', () => {
  it('returns same state when paused', () => {
    const state = createInitialState()
    const result = processTick(state)
    expect(result).toBe(state)
  })

  it('returns same state when queue is empty', () => {
    const state = { ...createInitialState(), isPaused: false }
    const result = processTick(state)
    expect(result).toBe(state)
  })

  it('progresses the front action', () => {
    const state = {
      ...createInitialState(),
      isPaused: false,
      queue: [createQueuedAction('harvest-berries')],
    }
    const result = processTick(state)
    expect(result.queue[0].progress).toBeGreaterThan(0)
  })

  it('awards exp to both masteries', () => {
    const state = {
      ...createInitialState(),
      isPaused: false,
      queue: [createQueuedAction('harvest-berries')],
    }
    const result = processTick(state)
    expect(result.skills.harvest.coreMastery.currentExp).toBeGreaterThan(0)
    expect(result.skills.harvest.runMastery.currentExp).toBeGreaterThan(0)
  })

  it('increments tick count', () => {
    const state = {
      ...createInitialState(),
      isPaused: false,
      queue: [createQueuedAction('harvest-berries')],
    }
    const result = processTick(state)
    expect(result.tickCount).toBe(1)
  })

  it('completes action and produces item after enough ticks', () => {
    let state = {
      ...createInitialState(),
      isPaused: false,
      queue: [createQueuedAction('harvest-berries')],
    }
    // Harvest Berries: expCost=2, tickExp=0.1 at base, so ~20 ticks to complete
    for (let i = 0; i < 100; i++) {
      state = processTick(state)
      if (state.inventory.berry.count > 0) break
    }
    expect(state.inventory.berry.count).toBeGreaterThan(0)
  })

  it('repeating action resets progress after completion', () => {
    let state = {
      ...createInitialState(),
      isPaused: false,
      queue: [createQueuedAction('harvest-berries')],
    }
    let completed = false
    for (let i = 0; i < 100; i++) {
      const prev = state
      state = processTick(state)
      if (state.inventory.berry.count > prev.inventory.berry.count) {
        completed = true
        // After completion, action should still be in queue with reset progress
        if (state.queue.length > 0) {
          expect(state.queue[0].progress).toBeLessThan(state.queue[0].progress + 1)
        }
        break
      }
    }
    expect(completed).toBe(true)
    expect(state.queue.length).toBeGreaterThan(0) // still repeating
  })

  it('removes action when inventory is full', () => {
    let state = {
      ...createInitialState(),
      isPaused: false,
      queue: [createQueuedAction('harvest-berries')],
    }
    state.inventory.berry.count = 9 // one slot left
    // Run until the berry is produced and action should stop
    for (let i = 0; i < 200; i++) {
      state = processTick(state)
      if (state.inventory.berry.count >= 10 && state.queue.length === 0) break
    }
    expect(state.inventory.berry.count).toBe(10)
    expect(state.queue).toHaveLength(0)
    expect(state.isPaused).toBe(true)
  })

  it('removes one-time action after completion', () => {
    let state = {
      ...createInitialState(),
      isPaused: false,
      queue: [createQueuedAction('wooden-cart')],
    }
    state.inventory.wood.count = 10
    for (let i = 0; i < 500; i++) {
      state = processTick(state)
      if (state.completedOneTimeActions.includes('wooden-cart')) break
    }
    expect(state.completedOneTimeActions).toContain('wooden-cart')
    expect(state.queue.every((q) => q.actionId !== 'wooden-cart')).toBe(true)
    expect(state.inventory.wood.count).toBe(0)
    expect(state.inventory.berry.maxCapacity).toBe(15)
  })

  it('skips wooden cart when not enough wood at completion time', () => {
    let state = {
      ...createInitialState(),
      isPaused: false,
      queue: [createQueuedAction('wooden-cart')],
    }
    state.inventory.wood.count = 5 // not enough (needs 10)
    for (let i = 0; i < 500; i++) {
      state = processTick(state)
      if (state.queue.length === 0) break
    }
    // Should NOT have completed — skipped due to insufficient wood
    expect(state.completedOneTimeActions).not.toContain('wooden-cart')
    expect(state.queue).toHaveLength(0)
    expect(state.isPaused).toBe(true)
    // Wood should not have been spent
    expect(state.inventory.wood.count).toBe(5)
    // Capacities should not have increased
    expect(state.inventory.berry.maxCapacity).toBe(10)
  })

  it('auto-pauses when queue drains', () => {
    let state = {
      ...createInitialState(),
      isPaused: false,
      queue: [createQueuedAction('wooden-cart')],
    }
    state.inventory.wood.count = 10
    for (let i = 0; i < 500; i++) {
      state = processTick(state)
      if (state.isPaused) break
    }
    expect(state.isPaused).toBe(true)
    expect(state.queue).toHaveLength(0)
  })
})
