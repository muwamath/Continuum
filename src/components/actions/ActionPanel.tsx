import type { Dispatch } from 'react'
import type { GameAction } from '../../hooks/useGameState'
import type { ActionCategory, ActionDefinition, GameState } from '../../engine/types'
import { actionDefinitionMap } from '../../data/actionDefinitions'
import { sceneDefinitions } from '../../data/sceneDefinitions'
import { createQueuedAction } from '../../engine/queue'
import { getAutomationThreshold, isAutomationUnlocked } from '../../engine/automation'
import { ActionButton } from './ActionButton'
import './ActionPanel.css'

interface ActionPanelProps {
  state: GameState
  dispatch: Dispatch<GameAction>
}

const categoryOrder: { id: ActionCategory; label: string }[] = [
  { id: 'gathering', label: 'Gathering' },
  { id: 'construction', label: 'Construction' },
  { id: 'exploration', label: 'Exploration' },
]

function cycleAutomationPriority(current: number): number {
  // Off(0) -> 5 -> 4 -> 3 -> 2 -> 1 -> Off(0)
  if (current === 0) return 5
  if (current === 1) return 0
  return current - 1
}

function renderActionButton(
  a: ActionDefinition,
  state: GameState,
  dispatch: Dispatch<GameAction>,
) {
  const completionCount = state.actionCompletionCounts[a.id] ?? 0
  const threshold = getAutomationThreshold(a)
  const unlocked = isAutomationUnlocked(a, state.actionCompletionCounts)
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
}

export function ActionPanel({ state, dispatch }: ActionPanelProps) {
  const scene = sceneDefinitions[state.currentSceneId]
  const sceneActionIds = scene ? scene.actionIds : []

  const available = sceneActionIds
    .map((id) => actionDefinitionMap.get(id))
    .filter((a) => a && !state.completedOneTimeActions.includes(a.id)) as ActionDefinition[]

  const grouped = new Map<ActionCategory, ActionDefinition[]>()
  for (const cat of categoryOrder) {
    grouped.set(cat.id, [])
  }
  for (const a of available) {
    grouped.get(a.category)?.push(a)
  }

  return (
    <div className="action-panel">
      <h2 className="action-panel__title">{scene ? scene.name : 'Actions'}</h2>
      {categoryOrder.map((cat) => {
        const actions = grouped.get(cat.id) ?? []
        return (
          <div key={cat.id} className="action-panel__group">
            <h3 className="action-panel__group-title">{cat.label}</h3>
            <div className="action-panel__list">
              {actions.map((a) => renderActionButton(a, state, dispatch))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
