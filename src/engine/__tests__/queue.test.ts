import { describe, it, expect, beforeEach } from 'vitest'
import {
  createQueuedAction,
  enqueueFront,
  enqueueBack,
  removeFromQueue,
  peekFront,
  _resetInstanceIdCounter,
} from '../queue'

beforeEach(() => {
  _resetInstanceIdCounter()
})

describe('createQueuedAction', () => {
  it('creates a queued action with unique instance IDs', () => {
    const a = createQueuedAction('harvest-berries')
    const b = createQueuedAction('harvest-berries')
    expect(a.actionId).toBe('harvest-berries')
    expect(a.progress).toBe(0)
    expect(a.instanceId).not.toBe(b.instanceId)
  })
})

describe('enqueueFront', () => {
  it('adds to front of queue', () => {
    const a = createQueuedAction('cut-wood')
    const b = createQueuedAction('harvest-berries')
    const queue = enqueueBack([], a)
    const result = enqueueFront(queue, b)
    expect(result[0].actionId).toBe('harvest-berries')
    expect(result[1].actionId).toBe('cut-wood')
  })
})

describe('enqueueBack', () => {
  it('adds to back of queue', () => {
    const a = createQueuedAction('cut-wood')
    const b = createQueuedAction('harvest-berries')
    let queue = enqueueBack([], a)
    queue = enqueueBack(queue, b)
    expect(queue[0].actionId).toBe('cut-wood')
    expect(queue[1].actionId).toBe('harvest-berries')
  })
})

describe('removeFromQueue', () => {
  it('removes by instance ID', () => {
    const a = createQueuedAction('cut-wood')
    const b = createQueuedAction('harvest-berries')
    const queue = [a, b]
    const result = removeFromQueue(queue, a.instanceId)
    expect(result).toHaveLength(1)
    expect(result[0].actionId).toBe('harvest-berries')
  })
})

describe('peekFront', () => {
  it('returns front item', () => {
    const a = createQueuedAction('cut-wood')
    expect(peekFront([a])).toBe(a)
  })

  it('returns undefined for empty queue', () => {
    expect(peekFront([])).toBeUndefined()
  })
})
