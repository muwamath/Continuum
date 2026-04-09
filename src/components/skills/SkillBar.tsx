import type { SkillId, SkillState } from '../../engine/types'
import { skillDefinitions } from '../../data/skillDefinitions'
import { SkillCard } from './SkillCard'
import './SkillBar.css'

interface SkillBarProps {
  skills: Record<SkillId, SkillState>
}

export function SkillBar({ skills }: SkillBarProps) {
  return (
    <div className="skill-bar">
      {Object.values(skillDefinitions).map((def) => (
        <SkillCard key={def.id} definition={def} state={skills[def.id]} />
      ))}
    </div>
  )
}
