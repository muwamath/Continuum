import type { ActionDefinition, SkillState } from '../../engine/types'
import type { SkillDefinition } from '../../data/skillDefinitions'
import { itemDefinitions } from '../../data/itemDefinitions'
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
      <p className="action-tooltip__desc">{action.description}</p>
      <table className="action-tooltip__table">
        <tbody>
          <tr>
            <td className="action-tooltip__label">Exp cost</td>
            <td className="action-tooltip__value">{action.expCost}</td>
          </tr>
          <tr>
            <td className="action-tooltip__label">Exp/tick</td>
            <td className="action-tooltip__value">{expPerTick.toFixed(3)}</td>
          </tr>
          <tr>
            <td className="action-tooltip__label">ETA</td>
            <td className="action-tooltip__value">{formatEta(secondsNeeded)}</td>
          </tr>
          {action.producedItem && itemDefinitions[action.producedItem]?.category === 'food' && (
            <tr>
              <td className="action-tooltip__label">Heals</td>
              <td className="action-tooltip__value">{itemDefinitions[action.producedItem].healAmount} HP</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
