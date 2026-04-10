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

function getFixedBelow(el: HTMLElement | null) {
  if (!el) return { top: 0, left: 0 }
  const rect = el.getBoundingClientRect()
  return { top: rect.bottom + 4, left: rect.left }
}

function getFixedAbove(el: HTMLElement | null) {
  if (!el) return { top: 0, right: 0 }
  const rect = el.getBoundingClientRect()
  return { top: rect.top - 4, right: window.innerWidth - rect.right }
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

  const tooltipPos = showTooltip ? getFixedBelow(buttonRef.current) : null
  const gearPos = showGearTooltip ? getFixedAbove(gearRef.current) : null

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
          {gearPos && (
            <div
              className="action-button__gear-tooltip"
              style={{
                position: 'fixed',
                top: `${gearPos.top}px`,
                right: `${gearPos.right}px`,
                transform: 'translateY(-100%)',
                zIndex: 9999,
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
      {tooltipPos && (
        <div
          style={{
            position: 'fixed',
            top: `${tooltipPos.top}px`,
            left: `${tooltipPos.left}px`,
            zIndex: 9999,
          }}
        >
          <ActionTooltip action={action} skillDef={skillDef} skillState={skillState} />
        </div>
      )}
    </div>
  )
}
