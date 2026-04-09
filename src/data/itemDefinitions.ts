import type { ItemId } from '../engine/types'

export interface ItemDefinition {
  id: ItemId
  name: string
  icon: string
  defaultMaxCapacity: number
  category?: 'food'
  healAmount?: number
  cooldownTicks?: number
}

export const itemDefinitions: Record<ItemId, ItemDefinition> = {
  berry: {
    id: 'berry',
    name: 'Berry',
    icon: 'berry',
    defaultMaxCapacity: 10,
    category: 'food',
    healAmount: 5,
    cooldownTicks: 50,
  },
  wood: {
    id: 'wood',
    name: 'Wood',
    icon: 'wood',
    defaultMaxCapacity: 10,
  },
}
