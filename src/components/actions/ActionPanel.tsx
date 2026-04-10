import type { Dispatch } from 'react'
import type { GameAction } from '../../hooks/useGameState'
import type { GameState } from '../../engine/types'
import { actionDefinitions } from '../../data/actionDefinitions'
import { sceneDefinitions } from '../../data/sceneDefinitions'
import { createQueuedAction } from '../../engine/queue'
import { getAutomationThreshold, isAutomationUnlocked } from '../../engine/automation'
import { ActionButton } from './ActionButton'
import './ActionPanel.css'

interface ActionPanelProps {
  state: GameState
  dispatch: Dispatch<GameAction>
}

function cycleAutomationPriority(current: number): number {
  // Off(0) -> 5 -> 4 -> 3 -> 2 -> 1 -> Off(0)
  if (current === 0) return 5
  if (current === 1) return 0
  return current - 1
}

export function ActionPanel({ state, dispatch }: ActionPanelProps) {
  const scene = sceneDefinitions[state.currentSceneId]
  const sceneActionIds = scene ? scene.actionIds : []

  const actionMap = new Map(actionDefinitions.map((a) => [a.id, a]))
  const available = sceneActionIds
    .map((id) => actionMap.get(id))
    .filter((a) => a && !state.completedOneTimeActions.includes(a.id)) as typeof actionDefinitions

  return (
    <div className="action-panel">
      <h2 className="action-panel__title">{scene ? scene.name : 'Actions'}</h2>
      <div className="action-panel__list">
        {available.map((a) => {
          const completionCount = state.actionCompletionCounts[a.id] ?? 0
          const threshold = getAutomationThreshold(a)
          const unlocked = isAutomationUnlocked(a.id, state.actionCompletionCounts, a)
          const priority = state.automationSettings[a.id] ?? 0

          return (
            <ActionButton
              key={a.id}
              action={a}
              skillState={state.skills[a.requiredSkill]}
              completionCount={completionCount}
              automationThreshold={threshold}
              isAutomationUnlocked={unlocked}
              automationPriority={priority}
              onEnqueueFront={() =>
                dispatch({ type: 'ENQUEUE_FRONT', action: createQueuedAction(a.id) })
              }
              onEnqueueBack={() =>
                dispatch({ type: 'ENQUEUE_BACK', action: createQueuedAction(a.id) })
              }
              onToggleAutomation={() =>
                dispatch({
                  type: 'SET_AUTOMATION_PRIORITY',
                  actionId: a.id,
                  priority: cycleAutomationPriority(priority),
                })
              }
            />
          )
        })}
      </div>
    </div>
  )
}
