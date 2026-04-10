export type SkillId =
  | 'harvest'
  | 'logging'
  | 'mining'
  | 'fishing'
  | 'hunting'
  | 'cooking'
  | 'smithing'
  | 'construction'
  | 'agility'
  | 'talking'

export type SkillCategory = 'gathering' | 'processing' | 'building' | 'movement-social'

export type ItemId = 'berry' | 'wood'

export interface MasteryState {
  level: number
  currentExp: number
}

export interface SkillState {
  coreMastery: MasteryState
  runMastery: MasteryState
  toolMultiplier: number
}

export interface InventoryItemState {
  count: number
  maxCapacity: number
}

export interface ItemCost {
  itemId: ItemId
  amount: number
}

export type ActionCategory = 'gathering' | 'construction' | 'exploration'

export interface ActionDefinition {
  id: string
  name: string
  description: string
  category: ActionCategory
  requiredSkill: SkillId
  expCost: number
  producedItem?: ItemId
  producedAmount?: number
  itemCosts?: ItemCost[]
  isOneTime: boolean
  capacityBonusOnComplete: number
  healthDecayMultiplier?: number
  leadsToScene?: string
}

export interface QueuedAction {
  instanceId: string
  actionId: string
  progress: number
  costsConsumed: number
  /**
   * If set, this is a finite "as needed" run. Each completion of a repeating action
   * decrements it; when it hits 0 the action is removed instead of repeating.
   */
  targetCount?: number
}

export interface StalledProgress {
  progress: number
  costsConsumed: number
}

export interface HealthState {
  current: number
  max: number
}

export interface RebirthState {
  count: number
  healthBonus: number
}

export interface GameState {
  skills: Record<SkillId, SkillState>
  inventory: Record<ItemId, InventoryItemState>
  queue: QueuedAction[]
  completedOneTimeActions: string[]
  isPaused: boolean
  pausedByUser: boolean
  tickCount: number
  health: HealthState
  rebirth: RebirthState
  foodCooldowns: Partial<Record<ItemId, number>>
  runTickCount: number
  healthDecayMultiplier: number
  isDead: boolean
  pendingRebirthBonus: number
  currentSceneId: string
  actionCompletionCounts: Record<string, number>
  automationSettings: Record<string, number>
  /** Action ids whose automation mode is "as needed" — reactive, not passive. */
  asNeededActions: Record<string, true>
  stalledActionProgress: Record<string, StalledProgress>
  /** Skill points: 1 per 15 minutes of run time. Persists across rebirths. Spent on perks. */
  skillPoints: number
  /** Permanent perk levels purchased with skill points. */
  perks: PerkState
}

export interface PerkState {
  /** Reduces health decay rate. -0.5% per level, capped at -50%. */
  ironStomach: number
  /** Reduces automation unlock threshold. -0.5% per level, capped at -50%. */
  quickLearner: number
  /** Increases food healing. +0.5% per level, no cap. */
  heartyMeals: number
}
