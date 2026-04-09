import type { Dispatch } from 'react'
import type { GameAction } from '../../hooks/useGameState'
import type { GameState } from '../../engine/types'
import { actionDefinitions } from '../../data/actionDefinitions'
import { createQueuedAction } from '../../engine/queue'
import { ActionButton } from './ActionButton'
import './ActionPanel.css'

interface ActionPanelProps {
  state: GameState
  dispatch: Dispatch<GameAction>
}

export function ActionPanel({ state, dispatch }: ActionPanelProps) {
  const available = actionDefinitions.filter(
    (a) => !state.completedOneTimeActions.includes(a.id),
  )

  return (
    <div className="action-panel">
      <h2 className="action-panel__title">Actions</h2>
      <div className="action-panel__list">
        {available.map((a) => (
          <ActionButton
            key={a.id}
            action={a}
            skillState={state.skills[a.requiredSkill]}
            onEnqueueFront={() =>
              dispatch({ type: 'ENQUEUE_FRONT', action: createQueuedAction(a.id) })
            }
            onEnqueueBack={() =>
              dispatch({ type: 'ENQUEUE_BACK', action: createQueuedAction(a.id) })
            }
          />
        ))}
      </div>
    </div>
  )
}
