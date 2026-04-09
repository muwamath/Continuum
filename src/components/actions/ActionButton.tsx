import type { ActionDefinition } from '../../engine/types'
import { skillDefinitions } from '../../data/skillDefinitions'
import { itemDefinitions } from '../../data/itemDefinitions'
import { Icon } from '../ui/Icon'
import './ActionButton.css'

interface ActionButtonProps {
  action: ActionDefinition
  onEnqueueFront: () => void
  onEnqueueBack: () => void
}

export function ActionButton({ action, onEnqueueFront, onEnqueueBack }: ActionButtonProps) {
  const skillDef = skillDefinitions[action.requiredSkill]

  return (
    <div className="action-button">
      <Icon name={skillDef.icon} size={24} alt={skillDef.name} />
      <div className="action-button__info">
        <span className="action-button__name">{action.name}</span>
        {action.itemCosts && action.itemCosts.length > 0 && (
          <span className="action-button__costs">
            {action.itemCosts.map((c) =>
              `${c.amount} ${itemDefinitions[c.itemId].name}`
            ).join(', ')}
          </span>
        )}
      </div>
      <button
        className="action-button__enqueue"
        onClick={onEnqueueFront}
        title="Add to front of queue"
        aria-label={`Add ${action.name} to front of queue`}
      >
        <Icon name="upgrade" size={18} alt="" />
      </button>
      <button
        className="action-button__enqueue"
        onClick={onEnqueueBack}
        title="Add to back of queue"
        aria-label={`Add ${action.name} to back of queue`}
      >
        <Icon name="smash-arrows" size={18} alt="" />
      </button>
    </div>
  )
}
