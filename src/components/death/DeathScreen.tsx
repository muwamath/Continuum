import { useState } from 'react'
import type { PerkState, RebirthState } from '../../engine/types'
import {
  getMaxHealth,
  getIronStomachMultiplier,
  getHeartyMealsMultiplier,
  PERK_INCREMENT,
  PERK_THRESHOLD_CAP,
} from '../../engine/health'
import './DeathScreen.css'

interface DeathScreenProps {
  pendingRebirthBonus: number
  rebirth: RebirthState
  skillPoints: number
  perks: PerkState
  onContinue: (allocations: PerkState) => void
}

type PerkId = keyof PerkState

interface PerkInfo {
  id: PerkId
  name: string
  description: string
  /** Format the current effect at a given level */
  formatEffect: (level: number) => string
}

const PERKS: PerkInfo[] = [
  {
    id: 'ironStomach',
    name: 'Iron Stomach',
    description: 'Reduces health decay rate',
    formatEffect: (level) => {
      const reduction = (1 - getIronStomachMultiplier({ ironStomach: level, quickLearner: 0, heartyMeals: 0 })) * 100
      return `−${reduction.toFixed(1)}% decay`
    },
  },
  {
    id: 'quickLearner',
    name: 'Quick Learner',
    description: 'Reduces automation unlock thresholds',
    formatEffect: (level) => {
      const reduction = Math.min(PERK_THRESHOLD_CAP, PERK_INCREMENT * level) * 100
      return `−${reduction.toFixed(1)}% threshold`
    },
  },
  {
    id: 'heartyMeals',
    name: 'Hearty Meals',
    description: 'Increases food healing',
    formatEffect: (level) => {
      const boost = (getHeartyMealsMultiplier({ ironStomach: 0, quickLearner: 0, heartyMeals: level }) - 1) * 100
      return `+${boost.toFixed(1)}% healing`
    },
  },
]

const EMPTY_ALLOCATIONS: PerkState = { ironStomach: 0, quickLearner: 0, heartyMeals: 0 }

export function DeathScreen({
  pendingRebirthBonus,
  rebirth,
  skillPoints,
  perks,
  onContinue,
}: DeathScreenProps) {
  const newMax = getMaxHealth(rebirth.healthBonus + pendingRebirthBonus)
  const [allocations, setAllocations] = useState<PerkState>(EMPTY_ALLOCATIONS)

  const totalAllocated =
    allocations.ironStomach + allocations.quickLearner + allocations.heartyMeals
  const remaining = skillPoints - totalAllocated

  function adjust(id: PerkId, delta: number) {
    const current = allocations[id]
    const next = current + delta
    if (next < 0) return
    if (delta > 0 && remaining <= 0) return
    setAllocations({ ...allocations, [id]: next })
  }

  function reset() {
    setAllocations(EMPTY_ALLOCATIONS)
  }

  function continueText(): string {
    if (skillPoints === 0) return 'Continue'
    if (totalAllocated === 0) return `Continue (${skillPoints} points unspent)`
    if (remaining === 0) return `Continue (spend ${totalAllocated})`
    return `Continue (spend ${totalAllocated}, ${remaining} unspent)`
  }

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

        <div className="death-screen__skills">
          <h2 className="death-screen__section-title">
            Skill Points: {remaining} / {skillPoints} available
          </h2>
          {skillPoints === 0 && (
            <p className="death-screen__skills-hint">
              Survive 15 minutes in a single run to earn 1 skill point.
            </p>
          )}
          {PERKS.map((perk) => {
            const currentLevel = perks[perk.id]
            const allocated = allocations[perk.id]
            const newLevel = currentLevel + allocated
            return (
              <div key={perk.id} className="death-screen__perk-row">
                <div className="death-screen__perk-info">
                  <span className="death-screen__perk-name">{perk.name}</span>
                  <span className="death-screen__perk-desc">{perk.description}</span>
                  <span className="death-screen__perk-effect">
                    Lv {currentLevel} ({perk.formatEffect(currentLevel)})
                    {allocated > 0 && (
                      <span className="death-screen__perk-preview">
                        {' → '}Lv {newLevel} ({perk.formatEffect(newLevel)})
                      </span>
                    )}
                  </span>
                </div>
                <div className="death-screen__perk-controls">
                  <button
                    className="death-screen__pt-btn"
                    onClick={() => adjust(perk.id, -1)}
                    disabled={allocated === 0}
                    aria-label={`Remove a point from ${perk.name}`}
                  >
                    −
                  </button>
                  <span className="death-screen__perk-allocated">+{allocated}</span>
                  <button
                    className="death-screen__pt-btn"
                    onClick={() => adjust(perk.id, 1)}
                    disabled={remaining === 0}
                    aria-label={`Add a point to ${perk.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            )
          })}
          {totalAllocated > 0 && (
            <button className="death-screen__reset-btn" onClick={reset}>
              Reset allocation
            </button>
          )}
        </div>

        <button
          className="death-screen__button"
          onClick={() => onContinue(allocations)}
        >
          {continueText()}
        </button>
      </div>
    </div>
  )
}

