import { useState, useRef } from 'react'
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
  const buttonRef = useRef<HTMLDivElement>(null)
  const gearRef = useRef<HTMLDivElement>(null)
  const skillDef: SkillDefinition = skillDefinitions[action.requiredSkill]

  function handleAutomationClick() {
    setPopKey((k) => k + 1)
    onToggleAutomation()
  }

  function getTooltipPos() {
    if (!buttonRef.current) return { top: 0, left: 0 }
    const rect = buttonRef.current.getBoundingClientRect()
    return { top: rect.top, left: rect.left }
  }

  function getGearTooltipPos() {
    if (!gearRef.current) return { top: 0, right: 0 }
    const rect = gearRef.current.getBoundingClientRect()
    return { top: rect.top, right: window.innerWidth - rect.right }
  }

  return (
    <div
      className="action-button"
      ref={buttonRef}
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
          ref={gearRef}
          onMouseEnter={() => setShowGearTooltip(true)}
          onMouseLeave={() => setShowGearTooltip(false)}
        >
          <Icon name="big-gear" size={18} alt="Automation progress" />
          {showGearTooltip && (
            <div
              className="action-button__gear-tooltip"
              style={{
                position: 'fixed',
                top: `${getGearTooltipPos().top - 6}px`,
                right: `${getGearTooltipPos().right}px`,
                transform: 'translateY(-100%)',
              }}
            >
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
        <div
          style={{
            position: 'fixed',
            top: `${getTooltipPos().top - 8}px`,
            left: `${getTooltipPos().left}px`,
            transform: 'translateY(-100%)',
            zIndex: 9999,
          }}
        >
          <ActionTooltip action={action} skillDef={skillDef} skillState={skillState} />
        </div>
      )}
    </div>
  )
}
