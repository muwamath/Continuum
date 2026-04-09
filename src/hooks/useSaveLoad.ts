import { useEffect, useRef } from 'react'
import type { Dispatch } from 'react'
import type { GameState } from '../engine/types'
import type { GameAction } from './useGameState'

const SAVE_KEY = 'continuum-save'
const SAVE_VERSION = 1
const AUTO_SAVE_INTERVAL_MS = 30_000

interface SaveData {
  version: number
  state: GameState
}

function serialize(state: GameState): string {
  const data: SaveData = { version: SAVE_VERSION, state }
  return JSON.stringify(data)
}

function deserialize(json: string): GameState | null {
  try {
    const data: SaveData = JSON.parse(json)
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
