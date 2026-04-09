import type { MasteryState, SkillState } from './types'

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

export function getTotalMultiplier(skill: SkillState): number {
  // Core mastery uses 0.05 per level, run mastery uses 0.01 per level
  // These are passed in from skill definitions at the call site
  // Here we just use the raw skill state — caller provides the multiplier calc
  return skill.toolMultiplier
}

export function getTotalMultiplierWithDefs(
  skill: SkillState,
  corePerLevel: number,
  runPerLevel: number,
): number {
  const coreMult = getMasteryMultiplier(skill.coreMastery.level, corePerLevel)
  const runMult = getMasteryMultiplier(skill.runMastery.level, runPerLevel)
  return coreMult * runMult * skill.toolMultiplier
}
