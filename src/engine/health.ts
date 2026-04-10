import type { GameState, ItemId } from './types'
import { itemDefinitions } from '../data/itemDefinitions'
import { removeItem } from './inventory'

export const BASE_HEALTH = 100
export const BASE_DAMAGE_PER_TICK = 0.01
export const DECAY_GROWTH_RATE = 1.25
export const REBIRTH_GROWTH_FACTOR = 0.01
export const DEFAULT_FOOD_COOLDOWN_TICKS = 50
export const TICKS_PER_MINUTE = 600

export function getMaxHealth(rebirthHealthBonus: number): number {
  return BASE_HEALTH + rebirthHealthBonus
}

export function getDamagePerTick(runTickCount: number, decayMultiplier: number = 1.0): number {
  const minutes = runTickCount / TICKS_PER_MINUTE
  return BASE_DAMAGE_PER_TICK * Math.pow(DECAY_GROWTH_RATE, minutes) * decayMultiplier
}

export function applyTickDamage(current: number, runTickCount: number, decayMultiplier: number = 1.0): number {
  return Math.max(0, current - getDamagePerTick(runTickCount, decayMultiplier))
}

export function applyHealing(current: number, max: number, amount: number): number {
  return Math.min(max, current + amount)
}

export function checkIsDead(current: number): boolean {
  return current <= 0
}

export function calculateRebirthBonus(runTickCount: number): number {
  return REBIRTH_GROWTH_FACTOR * Math.sqrt(runTickCount)
}

export function canAutoEat(
  healthCurrent: number,
  healthMax: number,
  healAmount: number,
  cooldownRemaining: number | undefined,
): boolean {
  if ((cooldownRemaining ?? 0) > 0) return false
  if (healthCurrent + healAmount > healthMax) return false
  return true
}

export function processAutoEat(state: GameState): GameState {
  let healthCurrent = state.health.current
  let inventory = state.inventory
  let cooldowns = { ...state.foodCooldowns }

  for (const def of Object.values(itemDefinitions)) {
    if (def.category !== 'food' || !def.healAmount) continue
    if (inventory[def.id].count <= 0) continue
    if (!canAutoEat(healthCurrent, state.health.max, def.healAmount, cooldowns[def.id])) continue

    healthCurrent = applyHealing(healthCurrent, state.health.max, def.healAmount)
    inventory = removeItem(inventory, def.id, 1)
    cooldowns[def.id] = def.cooldownTicks ?? DEFAULT_FOOD_COOLDOWN_TICKS
  }

  return {
    ...state,
    health: { ...state.health, current: healthCurrent },
    inventory,
    foodCooldowns: cooldowns,
  }
}

export function tickCooldowns(
  cooldowns: Partial<Record<ItemId, number>>,
): Partial<Record<ItemId, number>> {
  const result: Partial<Record<ItemId, number>> = {}
  for (const [id, remaining] of Object.entries(cooldowns)) {
    if (remaining && remaining > 1) {
      result[id as ItemId] = remaining - 1
    }
  }
  return result
}

export function performRebirth(state: GameState): GameState {
  const bonusFromThisRun = calculateRebirthBonus(state.runTickCount)
  const newHealthBonus = state.rebirth.healthBonus + bonusFromThisRun
  const newMax = getMaxHealth(newHealthBonus)

  const skills = {} as typeof state.skills
  for (const [id, skill] of Object.entries(state.skills)) {
    skills[id as keyof typeof state.skills] = {
      ...skill,
      runMastery: { level: 0, currentExp: 0 },
    }
  }

  const inventory = {} as typeof state.inventory
  for (const def of Object.values(itemDefinitions)) {
    inventory[def.id] = { count: 0, maxCapacity: def.defaultMaxCapacity }
  }

  return {
    ...state,
    skills,
    inventory,
    queue: [],
    completedOneTimeActions: [],
    isPaused: true,
    pausedByUser: false,
    health: { current: newMax, max: newMax },
    rebirth: {
      count: state.rebirth.count + 1,
      healthBonus: newHealthBonus,
    },
    foodCooldowns: {},
    runTickCount: 0,
    healthDecayMultiplier: 1.0,
    isDead: false,
    pendingRebirthBonus: 0,
    // Scene resets on rebirth so all actions are available again
    currentSceneId: 'act1-scene1',
    actionCompletionCounts: state.actionCompletionCounts,
    automationSettings: state.automationSettings,
    asNeededActions: state.asNeededActions,
    stalledActionProgress: {},
  }
}
