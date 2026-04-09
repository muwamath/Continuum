import type { ActionDefinition } from '../engine/types'

export const actionDefinitions: ActionDefinition[] = [
  {
    id: 'harvest-berries',
    name: 'Harvest Berries',
    requiredSkill: 'harvest',
    expCost: 2,
    producedItem: 'berry',
    producedAmount: 1,
    isOneTime: false,
    capacityBonusOnComplete: 0,
  },
  {
    id: 'cut-wood',
    name: 'Cut Wood',
    requiredSkill: 'logging',
    expCost: 5,
    producedItem: 'wood',
    producedAmount: 1,
    isOneTime: false,
    capacityBonusOnComplete: 0,
  },
  {
    id: 'wooden-cart',
    name: 'Wooden Cart',
    requiredSkill: 'construction',
    expCost: 20,
    itemCosts: [{ itemId: 'wood', amount: 10 }],
    isOneTime: true,
    capacityBonusOnComplete: 5,
  },
  {
    id: 'wooden-hut',
    name: 'Wooden Hut',
    requiredSkill: 'construction',
    expCost: 30,
    itemCosts: [{ itemId: 'wood', amount: 20 }],
    isOneTime: true,
    capacityBonusOnComplete: 0,
    healthDecayMultiplier: 0.5,
  },
]
