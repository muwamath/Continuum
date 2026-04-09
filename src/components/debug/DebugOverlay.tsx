import { useState, useEffect, useCallback } from 'react'
import type { Dispatch } from 'react'
import type { GameAction } from '../../hooks/useGameState'
import type { GameState, SkillId } from '../../engine/types'
import { skillDefinitions } from '../../data/skillDefinitions'
import './DebugOverlay.css'

interface DebugOverlayProps {
  state: GameState
  dispatch: Dispatch<GameAction>
}

function isLocalhost(): boolean {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}

export function DebugOverlay({ state, dispatch }: DebugOverlayProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editState, setEditState] = useState<GameState | null>(null)

  const handleOpen = useCallback(() => {
    setEditState(structuredClone(state))
    dispatch({ type: 'SET_DEBUG_STATE', state: { isPaused: true } })
    setIsOpen(true)
  }, [state, dispatch])

  const handleClose = useCallback(() => {
    if (editState) {
      dispatch({ type: 'SET_DEBUG_STATE', state: editState })
    }
    setIsOpen(false)
    setEditState(null)
  }, [editState, dispatch])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  if (!isLocalhost()) return null

  if (!isOpen) {
    return (
      <button className="debug-toggle" onClick={handleOpen} title="Open Debug Overlay">
        Debug
      </button>
    )
  }

  if (!editState) return null

  const updateSkill = (skillId: SkillId, field: string, value: number) => {
    const skills = { ...editState.skills }
    const skill = { ...skills[skillId] }

    if (field === 'coreLevel') skill.coreMastery = { ...skill.coreMastery, level: value }
    else if (field === 'coreExp') skill.coreMastery = { ...skill.coreMastery, currentExp: value }
    else if (field === 'runLevel') skill.runMastery = { ...skill.runMastery, level: value }
    else if (field === 'runExp') skill.runMastery = { ...skill.runMastery, currentExp: value }
    else if (field === 'toolMult') skill.toolMultiplier = value

    skills[skillId] = skill
    setEditState({ ...editState, skills })
  }

  const resetSkill = (skillId: SkillId) => {
    const skills = { ...editState.skills }
    skills[skillId] = {
      coreMastery: { level: 0, currentExp: 0 },
      runMastery: { level: 0, currentExp: 0 },
      toolMultiplier: 1.0,
    }
    setEditState({ ...editState, skills })
  }

  const resetAll = () => {
    const skills = { ...editState.skills }
    for (const id of Object.keys(skills) as SkillId[]) {
      skills[id] = {
        coreMastery: { level: 0, currentExp: 0 },
        runMastery: { level: 0, currentExp: 0 },
        toolMultiplier: 1.0,
      }
    }
    setEditState({
      ...editState,
      skills,
      inventory: {
        berry: { count: 0, maxCapacity: 10 },
        wood: { count: 0, maxCapacity: 10 },
      },
      queue: [],
      completedOneTimeActions: [],
      tickCount: 0,
    })
  }

  return (
    <div className="debug-backdrop" onClick={handleClose}>
      <div className="debug-overlay" onClick={(e) => e.stopPropagation()}>
        <div className="debug-overlay__header">
          <h2>Debug Overlay</h2>
          <div className="debug-overlay__header-actions">
            <button onClick={resetAll} className="debug-btn debug-btn--danger">
              Reset All
            </button>
            <button onClick={handleClose} className="debug-btn">
              Close (Esc)
            </button>
          </div>
        </div>

        <div className="debug-overlay__content">
          <h3>Skills</h3>
          {(Object.keys(editState.skills) as SkillId[]).map((id) => {
            const skill = editState.skills[id]
            const def = skillDefinitions[id]
            return (
              <div key={id} className="debug-skill">
                <div className="debug-skill__header">
                  <strong>{def.name}</strong>
                  <button onClick={() => resetSkill(id)} className="debug-btn debug-btn--small">
                    Reset
                  </button>
                </div>
                <div className="debug-skill__fields">
                  <label>
                    Core Lv
                    <input
                      type="number"
                      value={skill.coreMastery.level}
                      onChange={(e) => updateSkill(id, 'coreLevel', Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Core Exp
                    <input
                      type="number"
                      step="0.1"
                      value={skill.coreMastery.currentExp}
                      onChange={(e) => updateSkill(id, 'coreExp', Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Run Lv
                    <input
                      type="number"
                      value={skill.runMastery.level}
                      onChange={(e) => updateSkill(id, 'runLevel', Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Run Exp
                    <input
                      type="number"
                      step="0.1"
                      value={skill.runMastery.currentExp}
                      onChange={(e) => updateSkill(id, 'runExp', Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Tool Mult
                    <input
                      type="number"
                      step="0.1"
                      value={skill.toolMultiplier}
                      onChange={(e) => updateSkill(id, 'toolMult', Number(e.target.value))}
                    />
                  </label>
                </div>
              </div>
            )
          })}

          <h3>Inventory</h3>
          <div className="debug-skill__fields">
            <label>
              Berry Count
              <input
                type="number"
                value={editState.inventory.berry.count}
                onChange={(e) =>
                  setEditState({
                    ...editState,
                    inventory: {
                      ...editState.inventory,
                      berry: { ...editState.inventory.berry, count: Number(e.target.value) },
                    },
                  })
                }
              />
            </label>
            <label>
              Berry Cap
              <input
                type="number"
                value={editState.inventory.berry.maxCapacity}
                onChange={(e) =>
                  setEditState({
                    ...editState,
                    inventory: {
                      ...editState.inventory,
                      berry: { ...editState.inventory.berry, maxCapacity: Number(e.target.value) },
                    },
                  })
                }
              />
            </label>
            <label>
              Wood Count
              <input
                type="number"
                value={editState.inventory.wood.count}
                onChange={(e) =>
                  setEditState({
                    ...editState,
                    inventory: {
                      ...editState.inventory,
                      wood: { ...editState.inventory.wood, count: Number(e.target.value) },
                    },
                  })
                }
              />
            </label>
            <label>
              Wood Cap
              <input
                type="number"
                value={editState.inventory.wood.maxCapacity}
                onChange={(e) =>
                  setEditState({
                    ...editState,
                    inventory: {
                      ...editState.inventory,
                      wood: { ...editState.inventory.wood, maxCapacity: Number(e.target.value) },
                    },
                  })
                }
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
