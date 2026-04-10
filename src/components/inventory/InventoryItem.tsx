import { useState, useRef } from 'react'
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
  const [showTooltip, setShowTooltip] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fillRatio = state.maxCapacity > 0 ? state.count / state.maxCapacity : 0
  // Hue: 0 (red) at empty → 120 (green) at full
  const borderColor = `hsl(${Math.round(fillRatio * 120)}, 70%, 45%)`

  function getTooltipPos() {
    if (!ref.current) return { top: 0, left: 0 }
    const rect = ref.current.getBoundingClientRect()
    return { top: rect.bottom, left: rect.left }
  }

  return (
    <div
      className={`inventory-item ${atCapacity ? 'inventory-item--full' : ''}`}
      style={{ borderColor }}
      ref={ref}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Icon name={def.icon} size={24} alt={def.name} />
      <span className="inventory-item__name">{def.name}</span>
      <span className="inventory-item__count">
        {state.count} / {state.maxCapacity}
      </span>
      {showTooltip && (
        <div
          className="inventory-tooltip"
          style={{
            position: 'fixed',
            top: `${getTooltipPos().top + 4}px`,
            left: `${getTooltipPos().left}px`,
            zIndex: 9999,
          }}
        >
          <p className="inventory-tooltip__desc">{def.description}</p>
          {def.category === 'food' && def.healAmount && (
            <table className="inventory-tooltip__table">
              <tbody>
                <tr>
                  <td className="inventory-tooltip__label">Heals</td>
                  <td className="inventory-tooltip__value">{def.healAmount} HP</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
