import type { ItemId, InventoryItemState } from '../../engine/types'
import { InventoryItem } from './InventoryItem'
import './InventoryPanel.css'

interface InventoryPanelProps {
  inventory: Record<ItemId, InventoryItemState>
}

export function InventoryPanel({ inventory }: InventoryPanelProps) {
  return (
    <div className="inventory-panel">
      <h2 className="inventory-panel__title">Inventory</h2>
      <div className="inventory-panel__grid">
        {(Object.keys(inventory) as ItemId[]).map((id) => (
          <InventoryItem key={id} itemId={id} state={inventory[id]} />
        ))}
      </div>
    </div>
  )
}
