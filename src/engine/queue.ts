import type { QueuedAction } from './types'

let nextInstanceId = 1

export function createQueuedAction(actionId: string): QueuedAction {
  return {
    instanceId: String(nextInstanceId++),
    actionId,
    progress: 0,
  }
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

export function peekFront(queue: QueuedAction[]): QueuedAction | undefined {
  return queue[0]
}

// For testing: reset the ID counter
export function _resetInstanceIdCounter(): void {
  nextInstanceId = 1
}
