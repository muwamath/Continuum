import { useState } from 'react'
import type { SkillState } from '../../engine/types'
import type { SkillDefinition } from '../../data/skillDefinitions'
import { getExpToNextLevel, getTotalMultiplierWithDefs } from '../../engine/skills'
import { Icon } from '../ui/Icon'
import { ProgressBar } from '../ui/ProgressBar'
import { SkillTooltip } from './SkillTooltip'
import './SkillCard.css'

interface SkillCardProps {
  definition: SkillDefinition
  state: SkillState
}

export function SkillCard({ definition, state }: SkillCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const totalMult = getTotalMultiplierWithDefs(
    state,
    definition.coreMastery.multiplierPerLevel,
    definition.runMastery.multiplierPerLevel,
  )

  const coreExpNeeded = getExpToNextLevel(
    definition.coreMastery.baseExp,
    state.coreMastery.level,
  )
  const runExpNeeded = getExpToNextLevel(
    definition.runMastery.baseExp,
    state.runMastery.level,
  )

  return (
    <div
      className="skill-card"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={0}
    >
      <div className="skill-card__header">
        <Icon name={definition.icon} size={28} alt={definition.name} />
        <div className="skill-card__info">
          <span className="skill-card__name">{definition.name}</span>
          <span className="skill-card__mult">x{totalMult.toFixed(2)}</span>
        </div>
      </div>
      <div className="skill-card__bars">
        <ProgressBar
          value={state.coreMastery.currentExp / coreExpNeeded}
          color="var(--color-core-mastery)"
          height={3}
        />
        <ProgressBar
          value={state.runMastery.currentExp / runExpNeeded}
          color="var(--color-run-mastery)"
          height={3}
        />
      </div>
      {showTooltip && (
        <SkillTooltip definition={definition} state={state} totalMult={totalMult} />
      )}
    </div>
  )
}
