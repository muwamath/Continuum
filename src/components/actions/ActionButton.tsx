import { useState } from 'react'
import type { ActionDefinition, SkillState } from '../../engine/types'
import type { SkillDefinition } from '../../data/skillDefinitions'
import { skillDefinitions } from '../../data/skillDefinitions'
import { itemDefinitions } from '../../data/itemDefinitions'
import { Icon } from '../ui/Icon'
import { ActionTooltip } from './ActionTooltip'
import './ActionButton.css'

interface ActionButtonProps {
  action: ActionDefinition
  skillState: SkillState
  completionCount: number
  automationThreshold: number
  isAutomationUnlocked: boolean
  automationPriority: number
  onEnqueueFront: () => void
  onEnqueueBack: () => void
  onToggleAutomation: () => void
}

export function ActionButton({
  action,
  skillState,
  completionCount,
  automationThreshold,
  isAutomationUnlocked,
  automationPriority,
  onEnqueueFront,
  onEnqueueBack,
  onToggleAutomation,
}: ActionButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [showGearTooltip, setShowGearTooltip] = useState(false)
  const [popKey, setPopKey] = useState(0)
  const skillDef: SkillDefinition = skillDefinitions[action.requiredSkill]

  function handleAutomationClick() {
    setPopKey((k) => k + 1)
    onToggleAutomation()
  }

  return (
    <div
      className="action-button"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
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
      {!isAutomationUnlocked ? (
        <div
          className="action-button__gear-wrapper"
          onMouseEnter={() => setShowGearTooltip(true)}
          onMouseLeave={() => setShowGearTooltip(false)}
        >
          <Icon name="big-gear" size={18} alt="Automation progress" />
          {showGearTooltip && (
            <div className="action-button__gear-tooltip">
              {completionCount} / {automationThreshold} completions
            </div>
          )}
        </div>
      ) : (
        <button
          key={popKey}
          className={`action-button__automation ${automationPriority > 0 ? 'action-button__automation--active' : ''}`}
          onClick={handleAutomationClick}
          title={`Automation priority: ${automationPriority === 0 ? 'Off' : automationPriority}`}
          aria-label={`Toggle automation for ${action.name}`}
        >
          {automationPriority === 0 ? 'Off' : automationPriority}
        </button>
      )}
      {showTooltip && (
        <ActionTooltip action={action} skillDef={skillDef} skillState={skillState} />
      )}
    </div>
  )
}
