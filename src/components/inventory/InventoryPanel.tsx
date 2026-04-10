import type { ItemId, InventoryItemState } from '../../engine/types'
import { itemDefinitions, itemCategoryOrder } from '../../data/itemDefinitions'
import { InventoryItem } from './InventoryItem'
import './InventoryPanel.css'

interface InventoryPanelProps {
  inventory: Record<ItemId, InventoryItemState>
}

export function InventoryPanel({ inventory }: InventoryPanelProps) {
  const itemIds = Object.keys(inventory) as ItemId[]

  return (
    <div className="inventory-panel">
      <h2 className="inventory-panel__title">Inventory</h2>
      {itemCategoryOrder.map((cat) => {
        const items = itemIds.filter((id) => itemDefinitions[id].category === cat.id)
        return (
          <div key={cat.id} className="inventory-panel__group">
            <h3 className="inventory-panel__group-title">{cat.label}</h3>
            <div className="inventory-panel__grid">
              {items.map((id) => (
                <InventoryItem key={id} itemId={id} state={inventory[id]} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
