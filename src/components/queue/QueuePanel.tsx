import type { Dispatch } from 'react'
import type { GameAction } from '../../hooks/useGameState'
import type { GameState } from '../../engine/types'
import { GameStateIndicator } from './GameStateIndicator'
import { QueueItem } from './QueueItem'
import './QueuePanel.css'

interface QueuePanelProps {
  state: GameState
  dispatch: Dispatch<GameAction>
}

export function QueuePanel({ state, dispatch }: QueuePanelProps) {
  return (
    <div className="queue-panel">
      <GameStateIndicator isPaused={state.isPaused} />
      <h2 className="queue-panel__title">Action Queue</h2>
      <div className="queue-panel__list">
        {state.queue.length === 0 ? (
          <p className="queue-panel__empty">Queue is empty — add an action to start</p>
        ) : (
          state.queue.map((item, i) => (
            <QueueItem
              key={item.instanceId}
              item={item}
              isActive={i === 0}
              skills={state.skills}
              onCancel={() =>
                dispatch({ type: 'REMOVE_FROM_QUEUE', instanceId: item.instanceId })
              }
            />
          ))
        )}
      </div>
    </div>
  )
}
