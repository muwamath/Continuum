import type { SkillState } from '../../engine/types'
import type { SkillDefinition } from '../../data/skillDefinitions'
import { getExpToNextLevel, getMasteryMultiplier } from '../../engine/skills'
import './SkillTooltip.css'

interface SkillTooltipProps {
  definition: SkillDefinition
  state: SkillState
  totalMult: number
}

export function SkillTooltip({ definition, state, totalMult }: SkillTooltipProps) {
  const coreExpNeeded = getExpToNextLevel(
    definition.coreMastery.baseExp,
    state.coreMastery.level,
  )
  const runExpNeeded = getExpToNextLevel(
    definition.runMastery.baseExp,
    state.runMastery.level,
  )
  const coreMult = getMasteryMultiplier(
    state.coreMastery.level,
    definition.coreMastery.multiplierPerLevel,
  )
  const runMult = getMasteryMultiplier(
    state.runMastery.level,
    definition.runMastery.multiplierPerLevel,
  )

  return (
    <div className="skill-tooltip">
      <table>
        <thead>
          <tr>
            <th>Source</th>
            <th>Lv</th>
            <th>Experience</th>
            <th>Mult</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Core</td>
            <td>{state.coreMastery.level}</td>
            <td>{state.coreMastery.currentExp.toFixed(1)} / {coreExpNeeded.toFixed(1)}</td>
            <td>x{coreMult.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Run</td>
            <td>{state.runMastery.level}</td>
            <td>{state.runMastery.currentExp.toFixed(1)} / {runExpNeeded.toFixed(1)}</td>
            <td>x{runMult.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Tool</td>
            <td>-</td>
            <td>-</td>
            <td>x{state.toolMultiplier.toFixed(2)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td></td>
            <td></td>
            <td>x{totalMult.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
