import type { QueuedAction } from '../../engine/types'
import { actionDefinitions } from '../../data/actionDefinitions'
import { skillDefinitions } from '../../data/skillDefinitions'
import { Icon } from '../ui/Icon'
import { ProgressBar } from '../ui/ProgressBar'
import './QueueItem.css'

interface QueueItemProps {
  item: QueuedAction
  isActive: boolean
  onCancel: () => void
}

export function QueueItem({ item, isActive, onCancel }: QueueItemProps) {
  const actionDef = actionDefinitions.find((a) => a.id === item.actionId)
  if (!actionDef) return null

  const skillDef = skillDefinitions[actionDef.requiredSkill]
  const progressFraction = item.progress / actionDef.expCost

  return (
    <div className={`queue-item ${isActive ? 'queue-item--active' : ''}`}>
      <Icon name={skillDef.icon} size={20} alt={skillDef.name} />
      <div className="queue-item__info">
        <span className="queue-item__name">{actionDef.name}</span>
        <ProgressBar
          value={progressFraction}
          color="var(--accent)"
          height={4}
        />
      </div>
      <button
        className="queue-item__cancel"
        onClick={onCancel}
        title="Remove from queue"
        aria-label={`Remove ${actionDef.name} from queue`}
      >
        <Icon name="cancel" size={16} alt="" />
      </button>
    </div>
  )
}
