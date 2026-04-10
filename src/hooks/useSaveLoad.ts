import { useEffect, useRef } from 'react'
import type { Dispatch } from 'react'
import type { GameState } from '../engine/types'
import type { GameAction } from './useGameState'

const SAVE_KEY = 'continuum-save'
const SAVE_VERSION = 8
const AUTO_SAVE_INTERVAL_MS = 30_000

interface SaveData {
  version: number
  state: GameState
}

export function serializeSave(state: GameState): string {
  const data: SaveData = { version: SAVE_VERSION, state }
  return JSON.stringify(data, null, 2)
}

/**
 * Parse an imported save JSON string and return the restored GameState,
 * running any necessary migrations. Returns null if the JSON is malformed
 * or can't be migrated to the current version.
 */
export function importSaveJson(json: string): GameState | null {
  return deserialize(json)
}

function migrateState(data: SaveData): SaveData {
  if (data.version === 1) {
    data.state.health = { current: 10, max: 10 }
    data.state.rebirth = { count: 0, healthBonus: 0 }
    data.state.foodCooldowns = {}
    data.state.runTickCount = data.state.tickCount
    data.state.isDead = false
    data.state.pendingRebirthBonus = 0
    data.version = 2
  }
  if (data.version === 2) {
    data.state.healthDecayMultiplier = 1.0
    // Migrate health from old BASE_HEALTH of 10 to new 100
    if (data.state.health.max <= 20) {
      data.state.health.max = 100 + (data.state.health.max - 10)
      data.state.health.current = Math.min(data.state.health.current * 10, data.state.health.max)
    }
    data.version = 3
  }
  if (data.version === 3) {
    data.state.currentSceneId = 'act1-scene1'
    data.state.actionCompletionCounts = {}
    data.state.automationSettings = {}
    data.version = 4
  }
  if (data.version === 4) {
    data.state.asNeededActions = {}
    data.version = 5
  }
  if (data.version === 5) {
    // Legacy per-skill shape; the v6 → v7 migration below will convert it to a single number.
    ;(data.state as { skillPoints: unknown }).skillPoints = {
      harvest: 0,
      logging: 0,
      construction: 0,
      agility: 0,
    }
    data.version = 6
  }
  if (data.version === 6) {
    // Skill points are now a single global pool. Sum any per-skill points from v6 saves.
    const old = data.state.skillPoints as unknown as Record<string, number> | number
    if (typeof old === 'object' && old !== null) {
      data.state.skillPoints = Object.values(old).reduce((a, b) => a + b, 0)
    } else if (typeof old !== 'number') {
      data.state.skillPoints = 0
    }
    data.state.perks = { ironStomach: 0, quickLearner: 0, heartyMeals: 0 }
    data.version = 7
  }
  if (data.version === 7) {
    // 6 new skills added. Initialize them on existing saves so display code doesn't crash.
    const defaultSkill = {
      coreMastery: { level: 0, currentExp: 0 },
      runMastery: { level: 0, currentExp: 0 },
      toolMultiplier: 1.0,
    }
    const newSkillIds = ['mining', 'fishing', 'hunting', 'cooking', 'smithing', 'talking'] as const
    for (const id of newSkillIds) {
      if (!data.state.skills[id]) {
        data.state.skills[id] = { ...defaultSkill }
      }
    }
    data.version = 8
  }
  return data
}

function deserialize(json: string): GameState | null {
  try {
    const data: SaveData = migrateState(JSON.parse(json))
    if (data.version !== SAVE_VERSION) return null
    // Ensure completedOneTimeActions is an array (migration safety)
    if (!Array.isArray(data.state.completedOneTimeActions)) {
      data.state.completedOneTimeActions = []
    }
    return data.state
  } catch {
    return null
  }
}

export function loadSavedState(): GameState | null {
  const json = localStorage.getItem(SAVE_KEY)
  if (!json) return null
  return deserialize(json)
}

function saveState(state: GameState): void {
  localStorage.setItem(SAVE_KEY, serializeSave(state))
}

export function useSaveLoad(
  state: GameState,
  dispatch: Dispatch<GameAction>,
) {
  const stateRef = useRef(state)
  stateRef.current = state
  const hasLoadedRef = useRef(false)

  // Load on mount
  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    const saved = loadSavedState()
    if (saved) {
      dispatch({ type: 'SET_DEBUG_STATE', state: saved })
    }
  }, [dispatch])

  // Auto-save on interval
  useEffect(() => {
    const interval = setInterval(() => {
      saveState(stateRef.current)
    }, AUTO_SAVE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveState(stateRef.current)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
}
