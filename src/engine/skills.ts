import type { MasteryState } from './types'

export function getExpToNextLevel(baseExp: number, level: number): number {
  return baseExp * Math.pow(1.1, level)
}

export function addExp(
  mastery: MasteryState,
  baseExp: number,
  amount: number,
): MasteryState {
  let { level, currentExp } = mastery
  currentExp += amount
  let expNeeded = getExpToNextLevel(baseExp, level)
  while (currentExp >= expNeeded) {
    currentExp -= expNeeded
    level++
    expNeeded = getExpToNextLevel(baseExp, level)
  }
  return { level, currentExp }
}

export function getMasteryMultiplier(
  level: number,
  perLevel: number,
): number {
  return 1.0 + level * perLevel
}

export function getTotalMultiplierWithDefs(
  skill: { coreMastery: MasteryState; runMastery: MasteryState; toolMultiplier: number },
  corePerLevel: number,
  runPerLevel: number,
): number {
  const coreMult = getMasteryMultiplier(skill.coreMastery.level, corePerLevel)
  const runMult = getMasteryMultiplier(skill.runMastery.level, runPerLevel)
  return coreMult * runMult * skill.toolMultiplier
}
