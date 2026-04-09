import { describe, it, expect, beforeEach } from 'vitest'
import { processTick } from '../tick'
import { createInitialState } from '../gameState'
import { createQueuedAction, _resetInstanceIdCounter } from '../queue'

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
        break
      }
    }
    expect(completed).toBe(true)
    expect(state.queue.length).toBeGreaterThan(0)
  })

  it('removes action when inventory is full', () => {
    let state = {
      ...createInitialState(),
      isPaused: false,
      queue: [createQueuedAction('harvest-berries')],
    }
    state.inventory.berry.count = 9
    for (let i = 0; i < 200; i++) {
      state = processTick(state)
      if (state.inventory.berry.count >= 10 && state.queue.length === 0) break
    }
    expect(state.inventory.berry.count).toBe(10)
    expect(state.queue).toHaveLength(0)
    expect(state.isPaused).toBe(true)
  })

  it('wooden cart consumes wood incrementally and completes', () => {
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

  it('wooden cart progresses with partial wood and stops when out', () => {
    let state = {
      ...createInitialState(),
      isPaused: false,
      queue: [createQueuedAction('wooden-cart')],
    }
    state.inventory.wood.count = 3 // only 3 wood, needs 10
    for (let i = 0; i < 500; i++) {
      state = processTick(state)
      if (state.queue.length === 0) break
    }
    // Should have consumed the 3 wood and progressed partially
    expect(state.inventory.wood.count).toBe(0)
    // Should NOT have completed
    expect(state.completedOneTimeActions).not.toContain('wooden-cart')
    expect(state.queue).toHaveLength(0)
    expect(state.isPaused).toBe(true)
    // Capacities unchanged
    expect(state.inventory.berry.maxCapacity).toBe(10)
  })

  it('skips wooden cart when no wood available at all', () => {
    let state = {
      ...createInitialState(),
      isPaused: false,
      queue: [createQueuedAction('wooden-cart')],
    }
    state.inventory.wood.count = 0
    state = processTick(state)
    // Immediately removed — can't afford first unit
    expect(state.queue).toHaveLength(0)
    expect(state.isPaused).toBe(true)
    expect(state.completedOneTimeActions).not.toContain('wooden-cart')
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
