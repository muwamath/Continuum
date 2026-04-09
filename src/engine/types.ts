export type SkillId = 'harvest' | 'logging' | 'construction' | 'agility'
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

export interface ActionDefinition {
  id: string
  name: string
  requiredSkill: SkillId
  expCost: number
  producedItem?: ItemId
  producedAmount?: number
  itemCosts?: ItemCost[]
  isOneTime: boolean
  capacityBonusOnComplete: number
}

export interface QueuedAction {
  instanceId: string
  actionId: string
  progress: number
}

export interface GameState {
  skills: Record<SkillId, SkillState>
  inventory: Record<ItemId, InventoryItemState>
  queue: QueuedAction[]
  completedOneTimeActions: string[]
  isPaused: boolean
  tickCount: number
}
