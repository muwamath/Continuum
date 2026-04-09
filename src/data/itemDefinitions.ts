import type { ItemId } from '../engine/types'

export interface ItemDefinition {
  id: ItemId
  name: string
  icon: string
  defaultMaxCapacity: number
}

export const itemDefinitions: Record<ItemId, ItemDefinition> = {
  berry: {
    id: 'berry',
    name: 'Berry',
    icon: 'berry',
    defaultMaxCapacity: 10,
  },
  wood: {
    id: 'wood',
    name: 'Wood',
    icon: 'wood',
    defaultMaxCapacity: 10,
  },
}
