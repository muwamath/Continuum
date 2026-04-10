import type { ActionDefinition, GameState, QueuedAction, StalledProgress } from './types'
import { actionDefinitionMap } from '../data/actionDefinitions'
import { createQueuedAction } from './queue'
import { canActionProceed } from './actions'

export type AutomationMode = number | 'AN'

/** Cycle order: Off → AN → 1 → 2 → 3 → 4 → 5 → Off */
export function cycleAutomationMode(current: AutomationMode): AutomationMode {
  if (current === 0) return 'AN'
  if (current === 'AN') return 1
  if (current === 5) return 0
  return (current as number) + 1
}

export function automationModeLabel(mode: AutomationMode): string {
  if (mode === 0) return 'Off'
  if (mode === 'AN') return 'AN'
  return String(mode)
}

export function getAutomationMode(state: GameState, actionId: string): AutomationMode {
  if (state.asNeededActions[actionId]) return 'AN'
  return state.automationSettings[actionId] ?? 0
}

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
  stalledProgress?: Record<string, StalledProgress>,
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
      if (state.asNeededActions[c.id]) return false // AN actions fire reactively, not passively
      if (c.def.isOneTime && state.completedOneTimeActions.includes(c.id)) return false
      if (!canActionProceed(c.def, state)) return false
      return true
    })

  candidates.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    return a.index - b.index
  })

  return candidates.map((c) => createQueuedAction(c.id, stalledProgress))
}
