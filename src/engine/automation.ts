import type { ActionDefinition, GameState, ItemId, PerkState, QueuedAction, StalledProgress } from './types'
import { actionDefinitionMap } from '../data/actionDefinitions'
import { itemDefinitions } from '../data/itemDefinitions'
import { sceneDefinitions } from '../data/sceneDefinitions'
import { createQueuedAction } from './queue'
import { canActionProceed } from './actions'
import { PERK_INCREMENT, PERK_THRESHOLD_CAP } from './health'

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

/**
 * Effective automation threshold with the quickLearner perk applied.
 * Reduces the base threshold by 0.5% per perk level, capped at -50%, min 1.
 */
export function getEffectiveAutomationThreshold(
  actionDef: ActionDefinition,
  perks: PerkState | undefined,
): number {
  const base = getAutomationThreshold(actionDef)
  if (!perks) return base
  const reduction = Math.min(PERK_THRESHOLD_CAP, PERK_INCREMENT * perks.quickLearner)
  return Math.max(1, Math.ceil(base * (1 - reduction)))
}

export function isAutomationUnlocked(
  actionDef: ActionDefinition,
  completionCounts: Record<string, number>,
  perks?: PerkState,
): boolean {
  const count = completionCounts[actionDef.id] ?? 0
  return count >= getEffectiveAutomationThreshold(actionDef, perks)
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

/**
 * Find an AN food producer that should run, given a per-food predicate.
 * Returns a targeted QueuedAction that gathers exactly enough to top the food off
 * to its max capacity, or null if no food matches.
 */
function getFoodAsNeededFor(
  state: GameState,
  predicate: (count: number, max: number) => boolean,
): QueuedAction | null {
  const scene = sceneDefinitions[state.currentSceneId]
  if (!scene) return null
  for (const def of Object.values(itemDefinitions)) {
    if (def.category !== 'food') continue
    const id = def.id as ItemId
    const inv = state.inventory[id]
    if (!predicate(inv.count, inv.maxCapacity)) continue
    // Find an AN producer for this food in the current scene
    for (const actionId of scene.actionIds) {
      if (!state.asNeededActions[actionId]) continue
      const producer = actionDefinitionMap.get(actionId)
      if (!producer || producer.producedItem !== id || !producer.producedAmount) continue
      if (producer.isOneTime && state.completedOneTimeActions.includes(actionId)) continue
      const needed = inv.maxCapacity - inv.count
      const cycles = Math.max(1, Math.ceil(needed / producer.producedAmount))
      return createQueuedAction(actionId, undefined, cycles)
    }
  }
  return null
}

/**
 * Urgent food AN refill: any food at 0 with an AN producer should run immediately.
 * Used by entry points that fill the queue from a paused/idle state, where the per-tick
 * food-depletion trigger in `processTick` won't fire (because no tick is running).
 */
export function getFoodAsNeededRefill(state: GameState): QueuedAction | null {
  return getFoodAsNeededFor(state, (count) => count === 0)
}

/**
 * Fallback food AN top-up: when nothing else is queueable, top off any AN food that's
 * below max capacity. Only used after passive automation has nothing to offer.
 */
export function getFoodAsNeededTopUp(state: GameState): QueuedAction | null {
  return getFoodAsNeededFor(state, (count, max) => count < max)
}
