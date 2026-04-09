import { describe, it, expect } from 'vitest'
import {
  getExpToNextLevel,
  addExp,
  getMasteryMultiplier,
  getTotalMultiplierWithDefs,
} from '../skills'

describe('getExpToNextLevel', () => {
  it('returns base exp at level 0', () => {
    expect(getExpToNextLevel(10, 0)).toBe(10)
  })

  it('scales by 1.1 per level', () => {
    expect(getExpToNextLevel(10, 1)).toBeCloseTo(11)
    expect(getExpToNextLevel(10, 2)).toBeCloseTo(12.1)
  })

  it('works with run mastery base exp', () => {
    expect(getExpToNextLevel(25, 0)).toBe(25)
    expect(getExpToNextLevel(25, 1)).toBeCloseTo(27.5)
  })
})

describe('addExp', () => {
  it('adds exp without leveling up', () => {
    const result = addExp({ level: 0, currentExp: 0 }, 10, 5)
    expect(result.level).toBe(0)
    expect(result.currentExp).toBe(5)
  })

  it('levels up when exp reaches threshold', () => {
    const result = addExp({ level: 0, currentExp: 0 }, 10, 10)
    expect(result.level).toBe(1)
    expect(result.currentExp).toBe(0)
  })

  it('handles overflow exp into next level', () => {
    const result = addExp({ level: 0, currentExp: 0 }, 10, 12)
    expect(result.level).toBe(1)
    expect(result.currentExp).toBeCloseTo(2) // 12 - 10 = 2
  })

  it('handles multi-level-up in a single grant', () => {
    // Level 0 needs 10, level 1 needs 11, total 21 to reach level 2
    const result = addExp({ level: 0, currentExp: 0 }, 10, 25)
    expect(result.level).toBe(2)
    expect(result.currentExp).toBeCloseTo(4) // 25 - 10 - 11 = 4
  })

  it('adds to existing exp', () => {
    const result = addExp({ level: 0, currentExp: 8 }, 10, 5)
    expect(result.level).toBe(1)
    expect(result.currentExp).toBeCloseTo(3) // 8 + 5 = 13, 13 - 10 = 3
  })
})

describe('getMasteryMultiplier', () => {
  it('returns 1.0 at level 0', () => {
    expect(getMasteryMultiplier(0, 0.05)).toBe(1.0)
  })

  it('adds per-level bonus', () => {
    expect(getMasteryMultiplier(5, 0.05)).toBeCloseTo(1.25)
  })

  it('works with run mastery per-level', () => {
    expect(getMasteryMultiplier(10, 0.01)).toBeCloseTo(1.10)
  })
})

describe('getTotalMultiplierWithDefs', () => {
  it('multiplies all three sources', () => {
    const skill = {
      coreMastery: { level: 5, currentExp: 0 },
      runMastery: { level: 10, currentExp: 0 },
      toolMultiplier: 1.5,
    }
    // core: 1.25, run: 1.10, tool: 1.50
    // 1.25 * 1.10 * 1.50 = 2.0625
    const result = getTotalMultiplierWithDefs(skill, 0.05, 0.01)
    expect(result).toBeCloseTo(2.0625)
  })

  it('returns 1.0 at base state', () => {
    const skill = {
      coreMastery: { level: 0, currentExp: 0 },
      runMastery: { level: 0, currentExp: 0 },
      toolMultiplier: 1.0,
    }
    expect(getTotalMultiplierWithDefs(skill, 0.05, 0.01)).toBe(1.0)
  })
})
