import { useEffect, useRef } from 'react'
import type { Dispatch } from 'react'
import type { GameAction } from './useGameState'

const TICK_INTERVAL_MS = 100

export function useGameLoop(
  isPaused: boolean,
  dispatch: Dispatch<GameAction>,
) {
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = window.setInterval(() => {
        dispatch({ type: 'TICK' })
      }, TICK_INTERVAL_MS)
    }

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPaused, dispatch])
}
