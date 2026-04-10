import { useEffect, useRef } from 'react'
import type { Dispatch } from 'react'
import type { GameState } from '../engine/types'
import type { GameAction } from './useGameState'

const SAVE_KEY = 'continuum-save'
const SAVE_VERSION = 5
const AUTO_SAVE_INTERVAL_MS = 30_000

interface SaveData {
  version: number
  state: GameState
}

function serialize(state: GameState): string {
  const data: SaveData = { version: SAVE_VERSION, state }
  return JSON.stringify(data)
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
  localStorage.setItem(SAVE_KEY, serialize(state))
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
