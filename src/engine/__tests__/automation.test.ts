import { describe, it, expect } from 'vitest'
import { getAutomationThreshold, isAutomationUnlocked, getAutomatedActions } from '../automation'
import { createInitialState } from '../gameState'
import type { ActionDefinition } from '../types'

const repeatableAction: ActionDefinition = {
  id: 'test-repeatable',
  name: 'Test Repeatable',
  description: 'A test repeatable action',
  category: 'gathering',
  requiredSkill: 'harvest',
  expCost: 10,
  isOneTime: false,
  capacityBonusOnComplete: 0,
}

const oneTimeAction: ActionDefinition = {
  id: 'test-onetime',
  name: 'Test One Time',
  description: 'A test one-time action',
  category: 'gathering',
  requiredSkill: 'harvest',
  expCost: 10,
  isOneTime: true,
  capacityBonusOnComplete: 0,
}

describe('getAutomationThreshold', () => {
  it('returns 200 for repeatable actions', () => {
    expect(getAutomationThreshold(repeatableAction)).toBe(200)
  })

  it('returns 5 for one-time actions', () => {
    expect(getAutomationThreshold(oneTimeAction)).toBe(5)
  })
})

describe('isAutomationUnlocked', () => {
  it('returns false when count is below threshold', () => {
    expect(isAutomationUnlocked(repeatableAction, { 'test-repeatable': 199 })).toBe(false)
  })

  it('returns true when count equals threshold', () => {
    expect(isAutomationUnlocked(repeatableAction, { 'test-repeatable': 200 })).toBe(true)
  })

  it('returns true when count exceeds threshold', () => {
    expect(isAutomationUnlocked(oneTimeAction, { 'test-onetime': 10 })).toBe(true)
  })

  it('returns false when action has no completions', () => {
    expect(isAutomationUnlocked(repeatableAction, {})).toBe(false)
  })
})

describe('getAutomatedActions', () => {
  it('returns empty array when no automation is configured', () => {
    const state = createInitialState()
    const result = getAutomatedActions(state, ['harvest-berries', 'cut-wood'])
    expect(result).toEqual([])
  })

  it('returns actions sorted by priority (1 first)', () => {
    const state = {
      ...createInitialState(),
      automationSettings: {
        'harvest-berries': 3,
        'cut-wood': 1,
      },
    }
    const result = getAutomatedActions(state, ['harvest-berries', 'cut-wood'])
    expect(result).toHaveLength(2)
    expect(result[0].actionId).toBe('cut-wood')
    expect(result[1].actionId).toBe('harvest-berries')
  })

  it('preserves scene order for same priority', () => {
    const state = {
      ...createInitialState(),
      automationSettings: {
        'harvest-berries': 2,
        'cut-wood': 2,
      },
    }
    const result = getAutomatedActions(state, ['harvest-berries', 'cut-wood'])
    expect(result[0].actionId).toBe('harvest-berries')
    expect(result[1].actionId).toBe('cut-wood')
  })

  it('excludes actions with priority 0', () => {
    const state = {
      ...createInitialState(),
      automationSettings: {
        'harvest-berries': 0,
        'cut-wood': 1,
      },
    }
    const result = getAutomatedActions(state, ['harvest-berries', 'cut-wood'])
    expect(result).toHaveLength(1)
    expect(result[0].actionId).toBe('cut-wood')
  })

  it('excludes completed one-time actions', () => {
    const state = {
      ...createInitialState(),
      automationSettings: {
        'wooden-cart': 1,
      },
      completedOneTimeActions: ['wooden-cart'],
    }
    const result = getAutomatedActions(state, ['wooden-cart'])
    expect(result).toEqual([])
  })
})
