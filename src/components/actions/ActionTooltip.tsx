import type { ActionDefinition, SkillState } from '../../engine/types'
import type { SkillDefinition } from '../../data/skillDefinitions'
import { getTotalMultiplierWithDefs } from '../../engine/skills'
import './ActionTooltip.css'

interface ActionTooltipProps {
  action: ActionDefinition
  skillDef: SkillDefinition
  skillState: SkillState
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

export function ActionTooltip({ action, skillDef, skillState }: ActionTooltipProps) {
  const totalMult = getTotalMultiplierWithDefs(
    skillState,
    skillDef.coreMastery.multiplierPerLevel,
    skillDef.runMastery.multiplierPerLevel,
  )
  const expPerTick = totalMult * 0.1
  const ticksNeeded = Math.ceil(action.expCost / expPerTick)
  const secondsNeeded = ticksNeeded * 0.1 // 100ms per tick

  return (
    <div className="action-tooltip">
      <div className="action-tooltip__row">
        <span className="action-tooltip__label">Exp cost</span>
        <span>{action.expCost}</span>
      </div>
      <div className="action-tooltip__row">
        <span className="action-tooltip__label">Exp/tick</span>
        <span>{expPerTick.toFixed(3)}</span>
      </div>
      <div className="action-tooltip__row">
        <span className="action-tooltip__label">ETA</span>
        <span>{formatEta(secondsNeeded)}</span>
      </div>
    </div>
  )
}
