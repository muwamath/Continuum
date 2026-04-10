import { useState, useEffect, useRef } from 'react'
import type { Dispatch } from 'react'
import type { GameAction } from '../../hooks/useGameState'
import type { GameState, SkillId } from '../../engine/types'
import { skillDefinitions } from '../../data/skillDefinitions'
import { actionDefinitions } from '../../data/actionDefinitions'
import { calculateRebirthBonus } from '../../engine/health'
import { cycleAutomationMode, automationModeLabel } from '../../engine/automation'
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
  const [justCopied, setJustCopied] = useState(false)
  const editStateRef = useRef(editState)
  editStateRef.current = editState

  const handleOpen = () => {
    setEditState(structuredClone(state))
    dispatch({ type: 'SET_DEBUG_STATE', state: { isPaused: true } })
    setIsOpen(true)
  }

  const handleClose = () => {
    if (editStateRef.current) {
      dispatch({ type: 'SET_DEBUG_STATE', state: editStateRef.current })
    }
    setIsOpen(false)
    setEditState(null)
  }

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editStateRef.current) {
          dispatch({ type: 'SET_DEBUG_STATE', state: editStateRef.current })
        }
        setIsOpen(false)
        setEditState(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, dispatch])

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

  const handleExportState = async () => {
    const json = JSON.stringify(state, null, 2)
    try {
      await navigator.clipboard.writeText(json)
      setJustCopied(true)
      setTimeout(() => setJustCopied(false), 1500)
    } catch {
      window.prompt('Copy state JSON:', json)
    }
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
      health: { current: 100, max: 100 },
      rebirth: { count: 0, healthBonus: 0 },
      foodCooldowns: {},
      runTickCount: 0,
      healthDecayMultiplier: 1.0,
      isDead: false,
      pendingRebirthBonus: 0,
    })
  }

  return (
    <div className="debug-backdrop" onClick={handleClose}>
      <div className="debug-overlay" onClick={(e) => e.stopPropagation()}>
        <div className="debug-overlay__header">
          <h2>Debug Overlay</h2>
          <div className="debug-overlay__header-actions">
            <button onClick={handleExportState} className="debug-btn">
              {justCopied ? 'Copied!' : 'Export State'}
            </button>
            <button
              onClick={() => {
                if (window.confirm('Completely restart the game? This clears all progress and saved data.')) {
                  dispatch({ type: 'RESTART' })
                  setIsOpen(false)
                  setEditState(null)
                }
              }}
              className="debug-btn debug-btn--danger"
            >
              Restart Game
            </button>
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

          <h3>Health</h3>
          <div className="debug-skill__fields">
            <label>
              Current HP
              <input
                type="number"
                step="0.1"
                value={editState.health.current}
                onChange={(e) =>
                  setEditState({
                    ...editState,
                    health: { ...editState.health, current: Number(e.target.value) },
                  })
                }
              />
            </label>
            <label>
              Max HP
              <input
                type="number"
                step="0.1"
                value={editState.health.max}
                onChange={(e) =>
                  setEditState({
                    ...editState,
                    health: { ...editState.health, max: Number(e.target.value) },
                  })
                }
              />
            </label>
            <label>
              Rebirth Count
              <input
                type="number"
                value={editState.rebirth.count}
                onChange={(e) =>
                  setEditState({
                    ...editState,
                    rebirth: { ...editState.rebirth, count: Number(e.target.value) },
                  })
                }
              />
            </label>
            <label>
              Health Bonus
              <input
                type="number"
                step="0.1"
                value={editState.rebirth.healthBonus}
                onChange={(e) =>
                  setEditState({
                    ...editState,
                    rebirth: { ...editState.rebirth, healthBonus: Number(e.target.value) },
                  })
                }
              />
            </label>
          </div>
          <button
            onClick={() =>
              setEditState({
                ...editState,
                health: { ...editState.health, current: 0 },
                isDead: true,
                isPaused: true,
                pendingRebirthBonus: calculateRebirthBonus(editState.runTickCount),
              })
            }
            className="debug-btn debug-btn--danger"
          >
            Kill Player
          </button>

          <h3>Automation</h3>
          <div className="debug-automation">
            {actionDefinitions.map((a) => {
              const mode = editState.asNeededActions[a.id]
                ? ('AN' as const)
                : (editState.automationSettings[a.id] ?? 0)
              return (
                <div key={a.id} className="debug-automation__row">
                  <span className="debug-automation__name">{a.name}</span>
                  <button
                    className="debug-btn debug-btn--small"
                    onClick={() => {
                      const next = cycleAutomationMode(mode)
                      const newSettings = { ...editState.automationSettings }
                      const newAsNeeded = { ...editState.asNeededActions }
                      if (next === 'AN') {
                        delete newSettings[a.id]
                        newAsNeeded[a.id] = true
                      } else if (next === 0) {
                        delete newSettings[a.id]
                        delete newAsNeeded[a.id]
                      } else {
                        newSettings[a.id] = next
                        delete newAsNeeded[a.id]
                      }
                      setEditState({
                        ...editState,
                        automationSettings: newSettings,
                        asNeededActions: newAsNeeded,
                      })
                    }}
                  >
                    {automationModeLabel(mode)}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
