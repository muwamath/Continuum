import type { ItemId } from '../engine/types'

export type ItemCategory = 'food' | 'material'

export interface ItemDefinition {
  id: ItemId
  name: string
  description: string
  icon: string
  defaultMaxCapacity: number
  category: ItemCategory
  healAmount?: number
  cooldownTicks?: number
}

export const itemCategoryOrder: { id: ItemCategory; label: string }[] = [
  { id: 'food', label: 'Provisions' },
  { id: 'material', label: 'Materials' },
]

export const itemDefinitions: Record<ItemId, ItemDefinition> = {
  berry: {
    id: 'berry',
    name: 'Berry',
    description: 'A small, sweet berry. Automatically eaten when your health drops.',
    icon: 'berry',
    defaultMaxCapacity: 10,
    category: 'food',
    healAmount: 5,
    cooldownTicks: 50,
  },
  wood: {
    id: 'wood',
    name: 'Wood',
    description: 'Rough-hewn lumber. Used for building structures.',
    icon: 'wood',
    defaultMaxCapacity: 10,
    category: 'material',
  },
}
