import type { LaneItem, RuntimeSnapshot, StackFrame } from './types'

type LaneKey = 'callStack' | 'webApis' | 'callbackQueue' | 'microtaskQueue'

export type FlowNodeKey = LaneKey | 'runtime' | 'eventLoop' | 'console' | 'completed'

export type FlowTransition = {
  itemId: string
  label: string
  from: FlowNodeKey
  to: FlowNodeKey
}

const laneOrder: LaneKey[] = ['webApis', 'callbackQueue', 'microtaskQueue', 'callStack']

function laneLabel(key: LaneKey, item: LaneItem | StackFrame) {
  if ('label' in item) {
    return item.label
  }
  return key
}

function buildLaneMap(snapshot: RuntimeSnapshot) {
  const map = new Map<string, { lane: LaneKey; label: string }>()

  const addItems = <T extends LaneItem | StackFrame>(lane: LaneKey, items: T[]) => {
    items.forEach((item) => {
      map.set(item.id, {
        lane,
        label: laneLabel(lane, item),
      })
    })
  }

  addItems('callStack', snapshot.callStack)
  addItems('webApis', snapshot.webApis)
  addItems('callbackQueue', snapshot.callbackQueue)
  addItems('microtaskQueue', snapshot.microtaskQueue)

  return map
}

export function detectFlowTransition(
  previous: RuntimeSnapshot | undefined,
  current: RuntimeSnapshot | undefined,
): FlowTransition | null {
  if (!previous || !current) {
    return null
  }

  const previousMap = buildLaneMap(previous)
  const currentMap = buildLaneMap(current)

  for (const [itemId, now] of currentMap.entries()) {
    const before = previousMap.get(itemId)
    if (before && before.lane !== now.lane) {
      return {
        itemId,
        label: now.label,
        from: before.lane,
        to: now.lane,
      }
    }
  }

  if (
    previous.webApis.length > current.webApis.length &&
    current.callbackQueue.length > previous.callbackQueue.length
  ) {
    const movedItem =
      current.callbackQueue[current.callbackQueue.length - 1] ??
      previous.webApis[previous.webApis.length - 1]

    return {
      itemId: movedItem?.id ?? `web-to-callback-${current.id}`,
      label: movedItem?.label ?? 'queued callback',
      from: 'webApis',
      to: 'callbackQueue',
    }
  }

  if (
    previous.callbackQueue.length > current.callbackQueue.length &&
    current.callStack.length > previous.callStack.length
  ) {
    const movedItem = current.callStack[current.callStack.length - 1]
    return {
      itemId: movedItem?.id ?? `callback-to-stack-${current.id}`,
      label: movedItem?.label ?? 'callback execution',
      from: 'callbackQueue',
      to: 'callStack',
    }
  }

  if (
    previous.microtaskQueue.length > current.microtaskQueue.length &&
    current.callStack.length > previous.callStack.length
  ) {
    const movedItem = current.callStack[current.callStack.length - 1]
    return {
      itemId: movedItem?.id ?? `microtask-to-stack-${current.id}`,
      label: movedItem?.label ?? 'microtask execution',
      from: 'microtaskQueue',
      to: 'callStack',
    }
  }

  if (current.consoleLines.length > previous.consoleLines.length) {
    const lastLog = current.consoleLines[current.consoleLines.length - 1] ?? 'console.log'
    return {
      itemId: `console-${current.consoleLines.length}-${current.id}`,
      label: lastLog,
      from: 'callStack',
      to: 'console',
    }
  }

  for (const lane of laneOrder) {
    const collection = current[lane]
    const added = collection.find((item) => !previousMap.has(item.id))
    if (added) {
      return {
        itemId: added.id,
        label: added.label,
        from: 'runtime',
        to: lane,
      }
    }
  }

  for (const lane of laneOrder) {
    const collection = previous[lane]
    const removed = collection.find((item) => !currentMap.has(item.id))
    if (removed) {
      return {
        itemId: removed.id,
        label: removed.label,
        from: lane,
        to: 'completed',
      }
    }
  }

  if (previous.callStack.length > current.callStack.length) {
    const completedFrame = previous.callStack[previous.callStack.length - 1]
    return {
      itemId: completedFrame?.id ?? `callstack-pop-${current.id}`,
      label: completedFrame?.label ?? 'function returned',
      from: 'callStack',
      to: 'completed',
    }
  }

  return null
}

export function flowNodeName(node: FlowNodeKey): string {
  if (node === 'runtime') {
    return 'Runtime Scheduler'
  }
  if (node === 'completed') {
    return 'Completed'
  }
  if (node === 'callStack') {
    return 'Call Stack'
  }
  if (node === 'eventLoop') {
    return 'Event Loop'
  }
  if (node === 'console') {
    return 'Console'
  }
  if (node === 'webApis') {
    return 'Web APIs'
  }
  if (node === 'callbackQueue') {
    return 'Callback Queue'
  }
  return 'Microtask Queue'
}
