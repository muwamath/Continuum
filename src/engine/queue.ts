import type { QueuedAction, StalledProgress } from './types'

let nextInstanceId = 1

export function createQueuedAction(
  actionId: string,
  stalledProgress?: Record<string, StalledProgress>,
): QueuedAction {
  const saved = stalledProgress?.[actionId]
  return {
    instanceId: String(nextInstanceId++),
    actionId,
    progress: saved?.progress ?? 0,
    costsConsumed: saved?.costsConsumed ?? 0,
  }
}

export function stalledRemoval(
  queue: QueuedAction[],
  instanceId: string,
  existing: Record<string, StalledProgress>,
): { queue: QueuedAction[]; stalledActionProgress: Record<string, StalledProgress> } {
  const stalled = queue.find((a) => a.instanceId === instanceId)
  const newQueue = queue.filter((a) => a.instanceId !== instanceId)

  if (stalled && (stalled.progress > 0 || stalled.costsConsumed > 0)) {
    return {
      queue: newQueue,
      stalledActionProgress: {
        ...existing,
        [stalled.actionId]: {
          progress: stalled.progress,
          costsConsumed: stalled.costsConsumed,
        },
      },
    }
  }

  return { queue: newQueue, stalledActionProgress: existing }
}

export function enqueueFront(
  queue: QueuedAction[],
  action: QueuedAction,
): QueuedAction[] {
  return [action, ...queue]
}

export function enqueueBack(
  queue: QueuedAction[],
  action: QueuedAction,
): QueuedAction[] {
  return [...queue, action]
}

export function removeFromQueue(
  queue: QueuedAction[],
  instanceId: string,
): QueuedAction[] {
  return queue.filter((a) => a.instanceId !== instanceId)
}

// For testing: reset the ID counter
export function _resetInstanceIdCounter(): void {
  nextInstanceId = 1
}
