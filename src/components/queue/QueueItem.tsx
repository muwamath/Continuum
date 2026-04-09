import type { QueuedAction, SkillId, SkillState } from '../../engine/types'
import { actionDefinitions } from '../../data/actionDefinitions'
import { skillDefinitions } from '../../data/skillDefinitions'
import { getTotalMultiplierWithDefs } from '../../engine/skills'
import { Icon } from '../ui/Icon'
import { ProgressBar } from '../ui/ProgressBar'
import './QueueItem.css'

interface QueueItemProps {
  item: QueuedAction
  isActive: boolean
  skills: Record<SkillId, SkillState>
  onCancel: () => void
}

function formatEta(seconds: number): string {
  if (seconds < 1) return '< 1s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const parts: string[] = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (s > 0 || parts.length === 0) parts.push(`${s}s`)
  return parts.join(' ')
}

export function QueueItem({ item, isActive, skills, onCancel }: QueueItemProps) {
  const actionDef = actionDefinitions.find((a) => a.id === item.actionId)
  if (!actionDef) return null

  const skillDef = skillDefinitions[actionDef.requiredSkill]
  const progressFraction = item.progress / actionDef.expCost

  let etaText: string | null = null
  if (isActive) {
    const skillState = skills[actionDef.requiredSkill]
    const totalMult = getTotalMultiplierWithDefs(
      skillState,
      skillDef.coreMastery.multiplierPerLevel,
      skillDef.runMastery.multiplierPerLevel,
    )
    const expPerTick = totalMult * 0.1
    const remaining = actionDef.expCost - item.progress
    const ticksLeft = Math.ceil(remaining / expPerTick)
    etaText = formatEta(ticksLeft * 0.1)
  }

  return (
    <div className={`queue-item ${isActive ? 'queue-item--active' : ''}`}>
      <Icon name={skillDef.icon} size={20} alt={skillDef.name} />
      <div className="queue-item__info">
        <div className="queue-item__header">
          <span className="queue-item__name">{actionDef.name}</span>
          {etaText && <span className="queue-item__eta">{etaText}</span>}
        </div>
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
