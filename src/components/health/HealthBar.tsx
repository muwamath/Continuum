import type { HealthState, PerkState } from '../../engine/types'
import { getDamagePerTick, getIronStomachMultiplier } from '../../engine/health'
import { ProgressBar } from '../ui/ProgressBar'
import { Icon } from '../ui/Icon'
import './HealthBar.css'

interface HealthBarProps {
  health: HealthState
  runTickCount: number
  healthDecayMultiplier: number
  perks: PerkState
}

function getHealthColor(ratio: number): string {
  if (ratio > 0.5) return '#4caf50'
  if (ratio > 0.25) return '#ff9800'
  return '#f44336'
}

function formatRunTime(ticks: number): string {
  const totalSeconds = Math.floor(ticks / 10)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

export function HealthBar({ health, runTickCount, healthDecayMultiplier, perks }: HealthBarProps) {
  const ratio = health.max > 0 ? health.current / health.max : 0
  const effectiveDecayMultiplier = healthDecayMultiplier * getIronStomachMultiplier(perks)
  const damagePerTick = getDamagePerTick(runTickCount, effectiveDecayMultiplier)

  return (
    <div className="health-bar">
      <ProgressBar value={ratio} color={getHealthColor(ratio)} height={32} />
      <div className="health-bar__info">
        <span className="health-bar__stat">
          <Icon name="stopwatch" size={16} />
          {formatRunTime(runTickCount)}
        </span>
        <span className="health-bar__stat">
          <Icon name="hearts" size={16} />
          {health.current.toFixed(1)} / {health.max.toFixed(1)}
        </span>
        <span className="health-bar__stat">
          <Icon name="broken-heart" size={16} />
          {damagePerTick.toFixed(4)}/tick
        </span>
      </div>
    </div>
  )
}
