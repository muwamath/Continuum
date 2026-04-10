import type { SkillCategory, SkillId } from '../engine/types'

export interface SkillDefinition {
  id: SkillId
  name: string
  icon: string
  category: SkillCategory
  coreMastery: {
    baseExp: number
    multiplierPerLevel: number
  }
  runMastery: {
    baseExp: number
    multiplierPerLevel: number
  }
}

const DEFAULT_MASTERY = {
  coreMastery: { baseExp: 10, multiplierPerLevel: 0.05 },
  runMastery: { baseExp: 25, multiplierPerLevel: 0.01 },
}

export const skillDefinitions: Record<SkillId, SkillDefinition> = {
  // Gathering
  harvest: {
    id: 'harvest',
    name: 'Harvest',
    icon: 'wheat',
    category: 'gathering',
    ...DEFAULT_MASTERY,
  },
  logging: {
    id: 'logging',
    name: 'Logging',
    icon: 'logging',
    category: 'gathering',
    ...DEFAULT_MASTERY,
  },
  mining: {
    id: 'mining',
    name: 'Mining',
    icon: 'mining',
    category: 'gathering',
    ...DEFAULT_MASTERY,
  },
  fishing: {
    id: 'fishing',
    name: 'Fishing',
    icon: 'fishing-pole',
    category: 'gathering',
    ...DEFAULT_MASTERY,
  },
  hunting: {
    id: 'hunting',
    name: 'Hunting',
    icon: 'bow-arrow',
    category: 'gathering',
    ...DEFAULT_MASTERY,
  },

  // Processing
  cooking: {
    id: 'cooking',
    name: 'Cooking',
    icon: 'cooking-glove',
    category: 'processing',
    ...DEFAULT_MASTERY,
  },
  smithing: {
    id: 'smithing',
    name: 'Smithing',
    icon: 'anvil-impact',
    category: 'processing',
    ...DEFAULT_MASTERY,
  },

  // Building
  construction: {
    id: 'construction',
    name: 'Construction',
    icon: 'hammer-nails',
    category: 'building',
    ...DEFAULT_MASTERY,
  },

  // Movement / Social
  agility: {
    id: 'agility',
    name: 'Agility',
    icon: 'run',
    category: 'movement-social',
    ...DEFAULT_MASTERY,
  },
  talking: {
    id: 'talking',
    name: 'Talking',
    icon: 'conversation',
    category: 'movement-social',
    ...DEFAULT_MASTERY,
  },
}

export const skillCategoryOrder: { id: SkillCategory; label: string }[] = [
  { id: 'gathering', label: 'Gathering' },
  { id: 'processing', label: 'Processing' },
  { id: 'building', label: 'Building' },
  { id: 'movement-social', label: 'Movement / Social' },
]
