import type { SkillId } from '../engine/types'

export interface SkillDefinition {
  id: SkillId
  name: string
  icon: string
  coreMastery: {
    baseExp: number
    multiplierPerLevel: number
  }
  runMastery: {
    baseExp: number
    multiplierPerLevel: number
  }
}

export const skillDefinitions: Record<SkillId, SkillDefinition> = {
  harvest: {
    id: 'harvest',
    name: 'Harvest',
    icon: 'wheat',
    coreMastery: { baseExp: 10, multiplierPerLevel: 0.05 },
    runMastery: { baseExp: 25, multiplierPerLevel: 0.01 },
  },
  logging: {
    id: 'logging',
    name: 'Logging',
    icon: 'logging',
    coreMastery: { baseExp: 10, multiplierPerLevel: 0.05 },
    runMastery: { baseExp: 25, multiplierPerLevel: 0.01 },
  },
  construction: {
    id: 'construction',
    name: 'Construction',
    icon: 'hammer-nails',
    coreMastery: { baseExp: 10, multiplierPerLevel: 0.05 },
    runMastery: { baseExp: 25, multiplierPerLevel: 0.01 },
  },
  agility: {
    id: 'agility',
    name: 'Agility',
    icon: 'run',
    coreMastery: { baseExp: 10, multiplierPerLevel: 0.05 },
    runMastery: { baseExp: 25, multiplierPerLevel: 0.01 },
  },
}
