import type { ActionDefinition, GameState, QueuedAction } from './types'
import { actionDefinitionMap } from '../data/actionDefinitions'
import { createQueuedAction } from './queue'

export function getAutomationThreshold(actionDef: ActionDefinition): number {
  return actionDef.isOneTime ? 5 : 200
}

export function isAutomationUnlocked(
  actionDef: ActionDefinition,
  completionCounts: Record<string, number>,
): boolean {
  const count = completionCounts[actionDef.id] ?? 0
  return count >= getAutomationThreshold(actionDef)
}

/**
 * Get the list of automated actions for the current scene, sorted by priority.
 * Priority 1 goes first, then 2, etc. Same priority preserves scene action order.
 * Actions with priority 0 (off) or completed one-time actions are excluded.
 */
export function getAutomatedActions(
  state: GameState,
  sceneActionIds: string[],
): QueuedAction[] {
  const candidates = sceneActionIds
    .map((id, index) => ({
      id,
      index,
      priority: state.automationSettings[id] ?? 0,
      def: actionDefinitionMap.get(id),
    }))
    .filter((c) => {
      if (!c.def) return false
      if (c.priority === 0) return false
      if (c.def.isOneTime && state.completedOneTimeActions.includes(c.id)) return false
      return true
    })

  candidates.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    return a.index - b.index
  })

  return candidates.map((c) => createQueuedAction(c.id))
}
