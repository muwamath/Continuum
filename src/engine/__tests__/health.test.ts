import { describe, it, expect, beforeEach } from 'vitest'
import {
  BASE_HEALTH,
  BASE_DAMAGE_PER_TICK,
  DECAY_GROWTH_RATE,
  TICKS_PER_MINUTE,
  REBIRTH_GROWTH_FACTOR,
  getMaxHealth,
  getDamagePerTick,
  applyTickDamage,
  applyHealing,
  checkIsDead,
  calculateRebirthBonus,
  canAutoEat,
  processAutoEat,
  tickCooldowns,
  performRebirth,
} from '../health'
import { createInitialState } from '../gameState'
import { processTick } from '../tick'
import { createQueuedAction, _resetInstanceIdCounter } from '../queue'

beforeEach(() => {
  _resetInstanceIdCounter()
})

describe('getMaxHealth', () => {
  it('returns base health with no bonus', () => {
    expect(getMaxHealth(0)).toBe(BASE_HEALTH)
  })

  it('adds bonus to base health', () => {
    expect(getMaxHealth(5)).toBe(BASE_HEALTH + 5)
  })
})

describe('getDamagePerTick', () => {
  it('returns base damage at tick 0', () => {
    expect(getDamagePerTick(0)).toBe(BASE_DAMAGE_PER_TICK)
  })

  it('increases damage over time with 25% per minute', () => {
    const atOneMinute = getDamagePerTick(TICKS_PER_MINUTE)
    expect(atOneMinute).toBeCloseTo(BASE_DAMAGE_PER_TICK * DECAY_GROWTH_RATE)
  })

  it('compounds exponentially', () => {
    const atTwoMinutes = getDamagePerTick(TICKS_PER_MINUTE * 2)
    expect(atTwoMinutes).toBeCloseTo(BASE_DAMAGE_PER_TICK * DECAY_GROWTH_RATE ** 2)
  })

  it('respects decayMultiplier', () => {
    const normal = getDamagePerTick(0, 1.0)
    const halved = getDamagePerTick(0, 0.5)
    expect(halved).toBeCloseTo(normal * 0.5)
  })
})

describe('applyTickDamage', () => {
  it('reduces health by damage for current tick', () => {
    expect(applyTickDamage(100, 0)).toBeCloseTo(100 - BASE_DAMAGE_PER_TICK)
  })

  it('applies more damage at higher tick counts', () => {
    const resultEarly = applyTickDamage(100, 0)
    const resultLate = applyTickDamage(100, 10000)
    expect(resultLate).toBeLessThan(resultEarly)
  })

  it('respects decayMultiplier', () => {
    const normal = applyTickDamage(100, 0, 1.0)
    const halved = applyTickDamage(100, 0, 0.5)
    expect(halved).toBeGreaterThan(normal)
  })

  it('does not go below 0', () => {
    expect(applyTickDamage(0.001, 0)).toBe(0)
    expect(applyTickDamage(0, 0)).toBe(0)
  })
})

describe('applyHealing', () => {
  it('adds healing amount', () => {
    expect(applyHealing(5, 100, 3)).toBe(8)
  })

  it('caps at max', () => {
    expect(applyHealing(98, 100, 5)).toBe(100)
  })
})

describe('checkIsDead', () => {
  it('returns true at 0', () => {
    expect(checkIsDead(0)).toBe(true)
  })

  it('returns false when alive', () => {
    expect(checkIsDead(0.01)).toBe(false)
  })
})

describe('calculateRebirthBonus', () => {
  it('uses sqrt formula', () => {
    const bonus = calculateRebirthBonus(10000)
    expect(bonus).toBeCloseTo(REBIRTH_GROWTH_FACTOR * 100)
  })

  it('returns 0 for 0 ticks', () => {
    expect(calculateRebirthBonus(0)).toBe(0)
  })
})

describe('canAutoEat', () => {
  it('allows eating when no cooldown and room for healing', () => {
    expect(canAutoEat(90, 100, 5, undefined)).toBe(true)
  })

  it('blocks eating on cooldown', () => {
    expect(canAutoEat(90, 100, 5, 10)).toBe(false)
  })

  it('blocks eating when heal would exceed max', () => {
    expect(canAutoEat(96, 100, 5, undefined)).toBe(false)
  })

  it('allows eating at exact threshold', () => {
    expect(canAutoEat(95, 100, 5, undefined)).toBe(true)
  })
})

describe('tickCooldowns', () => {
  it('decrements cooldowns', () => {
    const result = tickCooldowns({ berry: 10 })
    expect(result.berry).toBe(9)
  })

  it('removes expired cooldowns', () => {
    const result = tickCooldowns({ berry: 1 })
    expect(result.berry).toBeUndefined()
  })

  it('handles empty cooldowns', () => {
    expect(tickCooldowns({})).toEqual({})
  })
})

describe('processAutoEat', () => {
  it('eats food when eligible', () => {
    const state = {
      ...createInitialState(),
      health: { current: 50, max: 100 },
      inventory: {
        berry: { count: 2, maxCapacity: 10 },
        wood: { count: 0, maxCapacity: 10 },
      },
    }
    const result = processAutoEat(state)
    expect(result.health.current).toBe(55)
    expect(result.inventory.berry.count).toBe(1)
    expect(result.foodCooldowns.berry).toBe(50)
  })

  it('does not eat when heal would exceed max', () => {
    const state = {
      ...createInitialState(),
      health: { current: 98, max: 100 },
      inventory: {
        berry: { count: 2, maxCapacity: 10 },
        wood: { count: 0, maxCapacity: 10 },
      },
    }
    const result = processAutoEat(state)
    expect(result.health.current).toBe(98)
    expect(result.inventory.berry.count).toBe(2)
  })

  it('does not eat on cooldown', () => {
    const state = {
      ...createInitialState(),
      health: { current: 50, max: 100 },
      inventory: {
        berry: { count: 2, maxCapacity: 10 },
        wood: { count: 0, maxCapacity: 10 },
      },
      foodCooldowns: { berry: 10 },
    }
    const result = processAutoEat(state)
    expect(result.health.current).toBe(50)
    expect(result.inventory.berry.count).toBe(2)
  })
})

describe('performRebirth', () => {
  it('increases max health and resets run state', () => {
    const state = {
      ...createInitialState(),
      isPaused: false,
      runTickCount: 10000,
      health: { current: 0, max: 100 },
      inventory: {
        berry: { count: 5, maxCapacity: 10 },
        wood: { count: 3, maxCapacity: 10 },
      },
      queue: [createQueuedAction('harvest-berries')],
    }

    const result = performRebirth(state)

    expect(result.rebirth.count).toBe(1)
    expect(result.rebirth.healthBonus).toBeCloseTo(REBIRTH_GROWTH_FACTOR * 100)
    expect(result.health.max).toBeCloseTo(BASE_HEALTH + REBIRTH_GROWTH_FACTOR * 100)
    expect(result.health.current).toBe(result.health.max)
    expect(result.inventory.berry.count).toBe(0)
    expect(result.inventory.wood.count).toBe(0)
    expect(result.queue).toEqual([])
    expect(result.isPaused).toBe(true)
    expect(result.runTickCount).toBe(0)
    expect(result.isDead).toBe(false)
    expect(result.healthDecayMultiplier).toBe(1.0)
  })

  it('preserves coreMastery', () => {
    const state = {
      ...createInitialState(),
      runTickCount: 1000,
      health: { current: 0, max: 100 },
    }
    state.skills.harvest.coreMastery = { level: 5, currentExp: 10 }
    state.skills.harvest.runMastery = { level: 3, currentExp: 7 }

    const result = performRebirth(state)

    expect(result.skills.harvest.coreMastery).toEqual({ level: 5, currentExp: 10 })
    expect(result.skills.harvest.runMastery).toEqual({ level: 0, currentExp: 0 })
  })

  it('resets healthDecayMultiplier', () => {
    const state = {
      ...createInitialState(),
      runTickCount: 1000,
      health: { current: 0, max: 100 },
      healthDecayMultiplier: 0.5,
    }

    const result = performRebirth(state)
    expect(result.healthDecayMultiplier).toBe(1.0)
  })
})

describe('processTick health integration', () => {
  it('applies damage when action is running', () => {
    const state = {
      ...createInitialState(),
      isPaused: false,
      queue: [createQueuedAction('harvest-berries')],
    }
    const result = processTick(state)
    expect(result.health.current).toBeCloseTo(100 - getDamagePerTick(0))
  })

  it('does not apply damage when paused', () => {
    const state = {
      ...createInitialState(),
      isPaused: true,
      queue: [createQueuedAction('harvest-berries')],
    }
    const result = processTick(state)
    expect(result).toBe(state)
  })

  it('triggers death when health reaches 0', () => {
    const damageAt500 = getDamagePerTick(500)
    const state = {
      ...createInitialState(),
      isPaused: false,
      queue: [createQueuedAction('harvest-berries')],
      health: { current: damageAt500, max: 100 },
      runTickCount: 500,
    }
    const result = processTick(state)
    expect(result.isDead).toBe(true)
    expect(result.isPaused).toBe(true)
    expect(result.pendingRebirthBonus).toBeGreaterThan(0)
  })

  it('increments runTickCount', () => {
    const state = {
      ...createInitialState(),
      isPaused: false,
      queue: [createQueuedAction('harvest-berries')],
    }
    const result = processTick(state)
    expect(result.runTickCount).toBe(1)
  })

  it('does not tick when dead', () => {
    const state = {
      ...createInitialState(),
      isPaused: false,
      isDead: true,
      queue: [createQueuedAction('harvest-berries')],
    }
    const result = processTick(state)
    expect(result).toBe(state)
  })

  it('uses healthDecayMultiplier for damage', () => {
    const normalState = {
      ...createInitialState(),
      isPaused: false,
      queue: [createQueuedAction('harvest-berries')],
    }
    const halvedState = {
      ...normalState,
      healthDecayMultiplier: 0.5,
    }
    const normalResult = processTick(normalState)
    const halvedResult = processTick(halvedState)
    // Halved decay means more health remaining
    expect(halvedResult.health.current).toBeGreaterThan(normalResult.health.current)
  })
})
