import type { HealthState, RebirthState } from '../../engine/types'
import { getMaxHealth } from '../../engine/health'
import './DeathScreen.css'

interface DeathScreenProps {
  pendingRebirthBonus: number
  rebirth: RebirthState
  onContinue: () => void
}

export function DeathScreen({ pendingRebirthBonus, rebirth, onContinue }: DeathScreenProps) {
  const newMax = getMaxHealth(rebirth.healthBonus + pendingRebirthBonus)

  return (
    <div className="death-screen">
      <div className="death-screen__card">
        <h1 className="death-screen__title">You Died</h1>
        <div className="death-screen__stats">
          <div className="death-screen__stat">
            <span className="death-screen__stat-label">Health gained</span>
            <span className="death-screen__stat-value">+{pendingRebirthBonus.toFixed(1)} Max HP</span>
          </div>
          <div className="death-screen__stat">
            <span className="death-screen__stat-label">New max health</span>
            <span className="death-screen__stat-value">{newMax.toFixed(1)} HP</span>
          </div>
        </div>
        <button className="death-screen__button" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  )
}
