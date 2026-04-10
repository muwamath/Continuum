import type { GameState, SkillId, ItemId } from './types'
import { skillDefinitions } from '../data/skillDefinitions'
import { itemDefinitions } from '../data/itemDefinitions'

export function createInitialState(): GameState {
  const skills = {} as Record<SkillId, GameState['skills'][SkillId]>
  for (const def of Object.values(skillDefinitions)) {
    skills[def.id] = {
      coreMastery: { level: 0, currentExp: 0 },
      runMastery: { level: 0, currentExp: 0 },
      toolMultiplier: 1.0,
    }
  }

  const inventory = {} as Record<ItemId, GameState['inventory'][ItemId]>
  for (const def of Object.values(itemDefinitions)) {
    inventory[def.id] = {
      count: 0,
      maxCapacity: def.defaultMaxCapacity,
    }
  }

  return {
    skills,
    inventory,
    queue: [],
    completedOneTimeActions: [],
    isPaused: true,
    pausedByUser: false,
    tickCount: 0,
    health: { current: 100, max: 100 },
    rebirth: { count: 0, healthBonus: 0 },
    foodCooldowns: {},
    runTickCount: 0,
    healthDecayMultiplier: 1.0,
    isDead: false,
    pendingRebirthBonus: 0,
    currentSceneId: 'act1-scene1',
    actionCompletionCounts: {},
    automationSettings: {},
    stalledActionProgress: {},
  }
}
