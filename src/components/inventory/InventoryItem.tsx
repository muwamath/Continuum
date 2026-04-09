import type { ItemId, InventoryItemState } from '../../engine/types'
import { itemDefinitions } from '../../data/itemDefinitions'
import { Icon } from '../ui/Icon'
import './InventoryItem.css'

interface InventoryItemProps {
  itemId: ItemId
  state: InventoryItemState
}

export function InventoryItem({ itemId, state }: InventoryItemProps) {
  const def = itemDefinitions[itemId]
  const atCapacity = state.count >= state.maxCapacity

  return (
    <div className={`inventory-item ${atCapacity ? 'inventory-item--full' : ''}`}>
      <Icon name={def.icon} size={24} alt={def.name} />
      <span className="inventory-item__name">{def.name}</span>
      <span className="inventory-item__count">
        {state.count} / {state.maxCapacity}
      </span>
    </div>
  )
}
