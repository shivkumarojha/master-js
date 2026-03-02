import type {
  LaneItem,
  MemoryCard,
  MemoryField,
  RuntimeSnapshot,
  StackFrame,
} from './types'

type RuntimeMutable = {
  clock: number
  callStack: StackFrame[]
  webApis: LaneItem[]
  callbackQueue: LaneItem[]
  microtaskQueue: LaneItem[]
  consoleLines: string[]
  memory: MemoryCard[]
  lexicalScopes: MemoryCard[]
}

type StepMeta = {
  title: string
  explanation: string
  focusLine: number | null
}

function cloneMemoryFields(fields: MemoryField[]): MemoryField[] {
  return fields.map((field) => ({ ...field }))
}

function cloneRuntime(runtime: RuntimeMutable) {
  return {
    callStack: runtime.callStack.map((frame) => ({ ...frame })),
    webApis: runtime.webApis.map((item) => ({ ...item })),
    callbackQueue: runtime.callbackQueue.map((item) => ({ ...item })),
    microtaskQueue: runtime.microtaskQueue.map((item) => ({ ...item })),
    consoleLines: [...runtime.consoleLines],
    memory: runtime.memory.map((card) => ({
      ...card,
      fields: cloneMemoryFields(card.fields),
    })),
    lexicalScopes: runtime.lexicalScopes.map((card) => ({
      ...card,
      fields: cloneMemoryFields(card.fields),
    })),
  }
}

function findLine(code: string, token: string): number | null {
  const lines = code.split('\n')
  const index = lines.findIndex((line) => line.includes(token))
  if (index === -1) {
    return null
  }
  return index + 1
}

function parseStringLiteral(rawValue: string | undefined, fallback: string): string {
  if (!rawValue) {
    return fallback
  }

  const trimmed = rawValue.trim()
  if (!trimmed) {
    return fallback
  }

  const first = trimmed[0]
  const last = trimmed[trimmed.length - 1]
  if ((first === '"' || first === '\'' || first === '`') && first === last) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

function parseNumber(rawValue: string | undefined, fallback: number): number {
  if (!rawValue) {
    return fallback
  }

  const value = Number(rawValue.trim())
  if (Number.isNaN(value)) {
    return fallback
  }

  return value
}

function setField(fields: MemoryField[], key: string, value: string) {
  const current = fields.find((field) => field.key === key)
  if (!current) {
    fields.push({ key, value })
    return
  }

  current.value = value
}

function buildBaseRuntime(): RuntimeMutable {
  return {
    clock: 0,
    callStack: [],
    webApis: [],
    callbackQueue: [],
    microtaskQueue: [],
    consoleLines: [],
    memory: [],
    lexicalScopes: [],
  }
}

function captureStep(
  snapshots: RuntimeSnapshot[],
  runtime: RuntimeMutable,
  meta: StepMeta,
) {
  const cloned = cloneRuntime(runtime)
  snapshots.push({
    id: snapshots.length,
    clock: runtime.clock,
    title: meta.title,
    explanation: meta.explanation,
    focusLine: meta.focusLine,
    ...cloned,
  })
}

export function buildRectangleTimeline(code: string): RuntimeSnapshot[] {
  const snapshots: RuntimeSnapshot[] = []
  const runtime = buildBaseRuntime()

  const constructorArgsMatch = code.match(/new\s+Rectangle\s*\(([^)]*)\)/)
  const args = constructorArgsMatch?.[1]?.split(',').map((part) => part.trim()) ?? []

  const width = parseNumber(args[0], 2)
  const height = parseNumber(args[1], 4)
  const color = parseStringLiteral(args[2], 'teal')
  const computedArea = width * height

  const globalScope: MemoryCard = {
    id: 'global-scope',
    title: 'Global Scope',
    fields: [
      { key: 'Rectangle', value: '<class>' },
      { key: 'rect', value: 'uninitialized' },
      { key: 'area', value: 'uninitialized' },
    ],
  }

  const lexicalGlobalScope: MemoryCard = {
    id: 'rectangle-lexical-global',
    title: 'Lexical Scope: global',
    fields: cloneMemoryFields(globalScope.fields),
  }

  runtime.memory.push(globalScope)
  runtime.lexicalScopes.push(lexicalGlobalScope)
  runtime.callStack.push({ id: 'global-frame', label: 'global()' })

  captureStep(snapshots, runtime, {
    title: 'Global execution starts',
    explanation:
      'The JavaScript engine creates a global frame and prepares class and variable declarations.',
    focusLine: findLine(code, 'class Rectangle'),
  })

  runtime.callStack.push({
    id: 'constructor-frame',
    label: 'Rectangle.constructor()',
    detail: `width=${width}, height=${height}, color=${color}`,
  })

  captureStep(snapshots, runtime, {
    title: 'Constructor invoked',
    explanation:
      'new Rectangle(...) pushes the constructor frame onto the call stack.',
    focusLine: findLine(code, 'new Rectangle'),
  })

  runtime.memory.push({
    id: 'rect-object',
    title: 'Rectangle#1',
    fields: [
      { key: 'width', value: String(width) },
      { key: 'height', value: String(height) },
      { key: 'color', value: color },
    ],
  })
  setField(globalScope.fields, 'rect', 'Rectangle#1')
  setField(lexicalGlobalScope.fields, 'rect', 'Rectangle#1')

  captureStep(snapshots, runtime, {
    title: 'Object allocated in memory',
    explanation:
      'The constructor assigns properties and stores a new Rectangle object in memory.',
    focusLine: findLine(code, 'this.width = width'),
  })

  runtime.callStack.pop()

  captureStep(snapshots, runtime, {
    title: 'Constructor returns',
    explanation: 'Control goes back to global() and the rect binding now points to Rectangle#1.',
    focusLine: findLine(code, 'const rect ='),
  })

  runtime.callStack.push({
    id: 'area-method-frame',
    label: 'rect.area()',
  })

  captureStep(snapshots, runtime, {
    title: 'Method call pushed to stack',
    explanation: 'Calling rect.area() creates a new function frame on top of global().',
    focusLine: findLine(code, 'const area = rect.area()'),
  })

  setField(globalScope.fields, 'area', String(computedArea))
  setField(lexicalGlobalScope.fields, 'area', String(computedArea))

  captureStep(snapshots, runtime, {
    title: 'Area computed',
    explanation: `Inside area(), width * height evaluates to ${computedArea}.`,
    focusLine: findLine(code, 'const area = this.width * this.height'),
  })

  runtime.callStack.pop()

  captureStep(snapshots, runtime, {
    title: 'Return to global scope',
    explanation: 'The method frame is popped and the return value is assigned to area.',
    focusLine: findLine(code, 'return area'),
  })

  runtime.callStack.push({ id: 'console-frame', label: 'console.log(area)' })
  runtime.consoleLines.push(String(computedArea))

  captureStep(snapshots, runtime, {
    title: 'Console output',
    explanation: `console.log prints ${computedArea}.`,
    focusLine: findLine(code, 'console.log(area)'),
  })

  runtime.callStack.pop()
  runtime.callStack.pop()

  captureStep(snapshots, runtime, {
    title: 'Program idle',
    explanation: 'The call stack is empty, so the runtime waits for more tasks.',
    focusLine: null,
  })

  return snapshots
}

export function buildEventLoopTimeline(code: string): RuntimeSnapshot[] {
  const snapshots: RuntimeSnapshot[] = []
  const runtime = buildBaseRuntime()

  const globalTimeoutDelay = parseNumber(
    code.match(/setTimeout\s*\(\s*function\s+timeout[\s\S]*?,\s*(\d+)\s*\)/)?.[1],
    5000,
  )
  const clickTimeoutDelay = parseNumber(
    code.match(/setTimeout\s*\(\s*function\s+timer[\s\S]*?,\s*(\d+)\s*\)/)?.[1],
    2000,
  )

  const bootMessage =
    parseStringLiteral(code.match(/console\.log\((['"`])Hi!\1\)/)?.[0]?.split('(')[1]?.slice(0, -1), 'Hi!') ||
    'Hi!'
  const welcomeMessage =
    parseStringLiteral(
      code
        .match(/console\.log\((['"`])Welcome to[^\n)]*\1\)/)?.[0]
        ?.split('(')[1]
        ?.slice(0, -1),
      'Welcome to loop lab.',
    ) || 'Welcome to loop lab.'

  const timeoutMessage =
    parseStringLiteral(
      code
        .match(/function\s+timeout\s*\([^)]*\)\s*{\s*console\.log\(([^)]+)\)/)?.[1],
      'Click the button!',
    ) || 'Click the button!'
  const clickMessage =
    parseStringLiteral(
      code.match(/function\s+timer\s*\([^)]*\)\s*{\s*console\.log\(([^)]+)\)/)?.[1],
      'You clicked the button!',
    ) || 'You clicked the button!'

  const simulatedClickAt = 1000
  const clickTimerFiresAt = simulatedClickAt + clickTimeoutDelay

  const globalScope: MemoryCard = {
    id: 'global-event-loop-scope',
    title: 'Global Scope',
    fields: [
      { key: 'button', value: '<button#teach>' },
      { key: 'onClick', value: '<function>' },
    ],
  }

  const lexicalGlobalScope: MemoryCard = {
    id: 'event-loop-lexical-global',
    title: 'Lexical Scope: global',
    fields: cloneMemoryFields(globalScope.fields),
  }

  runtime.memory.push(globalScope)
  runtime.lexicalScopes.push(lexicalGlobalScope)
  runtime.callStack.push({ id: 'global-event-loop-frame', label: 'global()' })

  captureStep(snapshots, runtime, {
    title: 'Script starts',
    explanation: 'JavaScript enters global() and starts evaluating top-level code.',
    focusLine: findLine(code, "addEventListener"),
  })

  runtime.webApis.push({
    id: 'dom-click-listener',
    label: `button click listener (waiting)` ,
    detail: 'DOM event source',
  })

  captureStep(snapshots, runtime, {
    title: 'Event listener registered',
    explanation: 'The click handler is registered and waits inside browser APIs.',
    focusLine: findLine(code, 'addEventListener'),
  })

  runtime.callStack.push({ id: 'console-hi-frame', label: 'console.log("Hi!")' })
  runtime.consoleLines.push(bootMessage)

  captureStep(snapshots, runtime, {
    title: 'First log executes',
    explanation: 'Synchronous console.log runs immediately on the call stack.',
    focusLine: findLine(code, 'console.log("Hi!")') ?? findLine(code, "console.log('Hi!')"),
  })

  runtime.callStack.pop()
  runtime.webApis.push({
    id: 'global-timeout',
    label: `timeout callback`,
    detail: `due at ${globalTimeoutDelay}ms`,
  })

  captureStep(snapshots, runtime, {
    title: 'Timer delegated to Web APIs',
    explanation:
      'setTimeout does not block. The callback waits in Web APIs until the delay expires.',
    focusLine: findLine(code, 'function timeout'),
  })

  runtime.callStack.push({ id: 'console-welcome-frame', label: 'console.log("Welcome")' })
  runtime.consoleLines.push(welcomeMessage)

  captureStep(snapshots, runtime, {
    title: 'Second log executes',
    explanation: 'Global code continues running while timers wait externally.',
    focusLine:
      findLine(code, 'console.log("Welcome') ?? findLine(code, "console.log('Welcome"),
  })

  runtime.callStack.pop()
  runtime.callStack.pop()

  captureStep(snapshots, runtime, {
    title: 'Call stack clears',
    explanation: 'Global execution finished. Event loop can now pull queued callbacks.',
    focusLine: null,
  })

  const runOuterTimeout = () => {
    runtime.clock = globalTimeoutDelay
    runtime.webApis = runtime.webApis.filter((item) => item.id !== 'global-timeout')
    runtime.callbackQueue.push({
      id: `global-timeout-callback-${globalTimeoutDelay}`,
      label: 'timeout callback',
      detail: `ready at ${globalTimeoutDelay}ms`,
    })

    captureStep(snapshots, runtime, {
      title: 'Outer timeout expires',
      explanation: 'The original setTimeout callback now enters the callback queue.',
      focusLine: findLine(code, 'function timeout'),
    })

    runtime.callbackQueue.shift()
    runtime.callStack.push({ id: `timeout-frame-${globalTimeoutDelay}`, label: 'timeout()' })
    runtime.consoleLines.push(timeoutMessage)

    captureStep(snapshots, runtime, {
      title: 'Outer timeout runs',
      explanation: `timeout() executes and logs: "${timeoutMessage}".`,
      focusLine: findLine(code, 'Click the button!') ?? findLine(code, 'function timeout'),
    })

    runtime.callStack.pop()

    captureStep(snapshots, runtime, {
      title: 'Runtime waits again',
      explanation: 'The call stack is empty, so the event loop checks for the next task.',
      focusLine: null,
    })
  }

  const processClickEvent = () => {
    runtime.clock = simulatedClickAt
    runtime.callbackQueue.push({
      id: 'click-callback',
      label: 'onClick callback',
      detail: `user click at ${simulatedClickAt}ms`,
    })

    captureStep(snapshots, runtime, {
      title: 'User click occurs (simulated)',
      explanation: 'A virtual click is injected to demonstrate DOM events entering the callback queue.',
      focusLine: findLine(code, 'addEventListener'),
    })

    runtime.callbackQueue.shift()
    runtime.callStack.push({ id: 'onclick-frame', label: 'onClick()' })

    captureStep(snapshots, runtime, {
      title: 'Click callback dequeued',
      explanation: 'Because the stack is empty, onClick moves from callback queue to call stack.',
      focusLine: findLine(code, 'function onClick'),
    })

    runtime.webApis.push({
      id: 'click-timeout',
      label: 'timer callback',
      detail: `due at ${clickTimerFiresAt}ms`,
    })

    captureStep(snapshots, runtime, {
      title: 'Nested timeout scheduled',
      explanation: 'Inside onClick, another timer is registered in Web APIs.',
      focusLine: findLine(code, 'function timer'),
    })

    runtime.callStack.pop()

    captureStep(snapshots, runtime, {
      title: 'Click handler returns',
      explanation: 'onClick finishes. The event loop waits for queued work.',
      focusLine: null,
    })
  }

  const runInnerTimeout = () => {
    runtime.clock = clickTimerFiresAt
    runtime.webApis = runtime.webApis.filter((item) => item.id !== 'click-timeout')
    runtime.callbackQueue.push({
      id: `click-timeout-callback-${clickTimerFiresAt}`,
      label: 'timer callback',
      detail: `ready at ${clickTimerFiresAt}ms`,
    })

    captureStep(snapshots, runtime, {
      title: 'Inner timer expires',
      explanation: 'The timer callback is moved from Web APIs to the callback queue.',
      focusLine: findLine(code, 'function timer'),
    })

    runtime.callbackQueue.shift()
    runtime.callStack.push({ id: `timer-frame-${clickTimerFiresAt}`, label: 'timer()' })
    runtime.consoleLines.push(clickMessage)

    captureStep(snapshots, runtime, {
      title: 'Inner timer runs',
      explanation: `timer() executes and logs: "${clickMessage}".`,
      focusLine: findLine(code, 'You clicked the button!') ?? findLine(code, 'console.log('),
    })

    runtime.callStack.pop()

    captureStep(snapshots, runtime, {
      title: 'Runtime waits again',
      explanation: 'The call stack is empty, so the event loop checks for the next task.',
      focusLine: null,
    })
  }

  let hasRunOuterTimeout = false

  if (globalTimeoutDelay <= simulatedClickAt) {
    runOuterTimeout()
    hasRunOuterTimeout = true
  }

  processClickEvent()

  if (!hasRunOuterTimeout && globalTimeoutDelay <= clickTimerFiresAt) {
    runOuterTimeout()
    hasRunOuterTimeout = true
  }

  runInnerTimeout()

  if (!hasRunOuterTimeout) {
    runOuterTimeout()
    hasRunOuterTimeout = true
  }

  if (hasRunOuterTimeout) {
    runtime.clock = Math.max(runtime.clock, globalTimeoutDelay, clickTimerFiresAt)
  }

  captureStep(snapshots, runtime, {
    title: 'Event loop idle',
    explanation: 'No more tasks remain, so execution pauses in an idle state.',
    focusLine: null,
  })

  return snapshots
}

export function buildPromiseTimeline(code: string): RuntimeSnapshot[] {
  const snapshots: RuntimeSnapshot[] = []
  const runtime = buildBaseRuntime()

  const startLog =
    parseStringLiteral(
      code.match(/console\.log\((['"`])script start\1\)/)?.[0]?.split('(')[1]?.slice(0, -1),
      'script start',
    ) || 'script start'

  const endLog =
    parseStringLiteral(
      code.match(/console\.log\((['"`])script end\1\)/)?.[0]?.split('(')[1]?.slice(0, -1),
      'script end',
    ) || 'script end'

  const timeoutLog =
    parseStringLiteral(
      code.match(/setTimeout\(\(\)\s*=>\s*console\.log\(([^)]+)\)/)?.[1],
      'timeout callback',
    ) || 'timeout callback'

  const firstThenLog =
    parseStringLiteral(
      code.match(/then\(\(\)\s*=>\s*console\.log\(([^)]+)\)\)/)?.[1],
      'promise then 1',
    ) || 'promise then 1'

  const secondThenLog =
    parseStringLiteral(
      code
        .match(/then\(\(\)\s*=>\s*console\.log\(([^)]+)\)\);?\s*$/m)?.[1],
      'promise then 2',
    ) || 'promise then 2'

  const promiseGlobalScope: MemoryCard = {
    id: 'promise-global',
    title: 'Global Scope',
    fields: [
      { key: 'resolvedPromise', value: '<fulfilled>' },
      { key: 'timeout callback', value: '<pending>' },
    ],
  }

  runtime.memory.push(promiseGlobalScope)
  runtime.lexicalScopes.push({
    id: 'promise-lexical-global',
    title: 'Lexical Scope: global',
    fields: cloneMemoryFields(promiseGlobalScope.fields),
  })

  runtime.callStack.push({ id: 'promise-global-frame', label: 'global()' })

  captureStep(snapshots, runtime, {
    title: 'Script begins',
    explanation: 'Global code starts executing synchronously.',
    focusLine: findLine(code, 'console.log('),
  })

  runtime.callStack.push({ id: 'promise-start-log', label: 'console.log(start)' })
  runtime.consoleLines.push(startLog)

  captureStep(snapshots, runtime, {
    title: 'Synchronous start log',
    explanation: 'First console.log executes immediately.',
    focusLine: findLine(code, 'script start'),
  })

  runtime.callStack.pop()
  runtime.webApis.push({
    id: 'promise-timeout',
    label: 'timeout callback',
    detail: 'due at 0ms',
  })

  captureStep(snapshots, runtime, {
    title: 'Timer scheduled',
    explanation:
      'setTimeout callback is delegated to Web APIs even with a 0ms delay.',
    focusLine: findLine(code, 'setTimeout'),
  })

  runtime.microtaskQueue.push({
    id: 'then-one',
    label: 'promise then #1',
    detail: 'microtask',
  })

  captureStep(snapshots, runtime, {
    title: 'Microtask queued',
    explanation:
      'Promise.resolve().then(...) queues a microtask that will run before macrotasks.',
    focusLine: findLine(code, 'Promise.resolve()'),
  })

  runtime.callStack.push({ id: 'promise-end-log', label: 'console.log(end)' })
  runtime.consoleLines.push(endLog)

  captureStep(snapshots, runtime, {
    title: 'Synchronous end log',
    explanation: 'Global script reaches the final console.log before async work executes.',
    focusLine: findLine(code, 'script end'),
  })

  runtime.callStack.pop()
  runtime.callStack.pop()

  captureStep(snapshots, runtime, {
    title: 'Global frame exits',
    explanation: 'The stack is clear, so the event loop starts draining microtasks first.',
    focusLine: null,
  })

  runtime.microtaskQueue.shift()
  runtime.callStack.push({ id: 'then-one-frame', label: 'then #1 callback' })
  runtime.consoleLines.push(firstThenLog)
  runtime.microtaskQueue.push({
    id: 'then-two',
    label: 'promise then #2',
    detail: 'chained microtask',
  })

  captureStep(snapshots, runtime, {
    title: 'First microtask executes',
    explanation: 'The first then callback runs and schedules the next then as another microtask.',
    focusLine: findLine(code, 'promise then 1') ?? findLine(code, '.then'),
  })

  runtime.callStack.pop()

  captureStep(snapshots, runtime, {
    title: 'Microtask checkpoint continues',
    explanation: 'Event loop stays in the microtask checkpoint until the queue is empty.',
    focusLine: null,
  })

  runtime.microtaskQueue.shift()
  runtime.callStack.push({ id: 'then-two-frame', label: 'then #2 callback' })
  runtime.consoleLines.push(secondThenLog)

  captureStep(snapshots, runtime, {
    title: 'Second microtask executes',
    explanation: 'The second then callback runs before any timeout callback.',
    focusLine: findLine(code, 'promise then 2') ?? findLine(code, '.then'),
  })

  runtime.callStack.pop()

  captureStep(snapshots, runtime, {
    title: 'Microtasks completed',
    explanation: 'Only after microtasks finish can the event loop handle callback queue tasks.',
    focusLine: null,
  })

  runtime.webApis = runtime.webApis.filter((item) => item.id !== 'promise-timeout')
  runtime.callbackQueue.push({
    id: 'promise-timeout-callback',
    label: 'timeout callback',
    detail: 'macrotask ready',
  })

  captureStep(snapshots, runtime, {
    title: 'Timeout becomes ready',
    explanation: 'The timer callback moves from Web APIs into the callback queue.',
    focusLine: findLine(code, 'setTimeout'),
  })

  runtime.callbackQueue.shift()
  runtime.callStack.push({ id: 'timeout-macrotask-frame', label: 'timeout callback' })
  runtime.consoleLines.push(timeoutLog)

  captureStep(snapshots, runtime, {
    title: 'Macrotask executes last',
    explanation: 'The timeout callback runs after all queued microtasks are done.',
    focusLine: findLine(code, 'timeout callback') ?? findLine(code, 'setTimeout'),
  })

  runtime.callStack.pop()

  captureStep(snapshots, runtime, {
    title: 'Runtime idle',
    explanation: 'No stack frames or queued tasks remain.',
    focusLine: null,
  })

  return snapshots
}

export function buildClosureTimeline(code: string): RuntimeSnapshot[] {
  const snapshots: RuntimeSnapshot[] = []
  const runtime = buildBaseRuntime()

  const initialCount = parseNumber(
    code.match(/createCounter\s*\(([^)]*)\)/)?.[1],
    2,
  )

  const globalScope: MemoryCard = {
    id: 'closure-global-memory',
    title: 'Global Scope',
    fields: [
      { key: 'createCounter', value: '<function>' },
      { key: 'counter', value: 'uninitialized' },
    ],
  }

  const lexicalGlobalScope: MemoryCard = {
    id: 'closure-lexical-global',
    title: 'Lexical Scope: global',
    fields: cloneMemoryFields(globalScope.fields),
  }

  runtime.memory.push(globalScope)
  runtime.lexicalScopes.push(lexicalGlobalScope)
  runtime.callStack.push({ id: 'closure-global-frame', label: 'global()' })

  captureStep(snapshots, runtime, {
    title: 'Global execution begins',
    explanation:
      'The global scope is created and the createCounter function is hoisted.',
    focusLine: findLine(code, 'function createCounter'),
  })

  runtime.callStack.push({
    id: 'create-counter-frame',
    label: 'createCounter(start)',
    detail: `start=${initialCount}`,
  })

  const functionScope: MemoryCard = {
    id: 'create-counter-scope',
    title: 'Lexical Scope: createCounter',
    fields: [
      { key: 'start', value: String(initialCount) },
      { key: 'count', value: String(initialCount) },
      { key: 'increment', value: '<function>' },
    ],
  }

  runtime.lexicalScopes.push(functionScope)

  captureStep(snapshots, runtime, {
    title: 'createCounter called',
    explanation:
      'A new function scope is created with local variable count initialized from start.',
    focusLine: findLine(code, 'const count = start') ?? findLine(code, 'let count = start'),
  })

  runtime.memory.push({
    id: 'increment-function',
    title: 'Function increment()',
    fields: [
      { key: '[[Environment]]', value: 'createCounter lexical scope' },
      { key: 'captured count', value: String(initialCount) },
    ],
  })
  setField(globalScope.fields, 'counter', 'increment()')
  setField(lexicalGlobalScope.fields, 'counter', 'increment()')

  captureStep(snapshots, runtime, {
    title: 'Closure created',
    explanation:
      'increment is returned with a reference to createCounter lexical scope, not a copy.',
    focusLine: findLine(code, 'return function increment') ?? findLine(code, 'return increment'),
  })

  runtime.callStack.pop()
  functionScope.title = 'Closure Scope: captured by increment'

  captureStep(snapshots, runtime, {
    title: 'Function returned to global scope',
    explanation:
      'The createCounter frame is removed, but its lexical scope survives because increment still references it.',
    focusLine: findLine(code, 'const counter = createCounter'),
  })

  runtime.callStack.push({
    id: 'counter-call-1',
    label: 'counter() -> increment()',
    detail: 'first invocation',
  })

  captureStep(snapshots, runtime, {
    title: 'First closure invocation',
    explanation:
      'Calling counter() executes increment() and reopens access to captured variable count.',
    focusLine: findLine(code, 'counter();'),
  })

  const countAfterFirstCall = initialCount + 1
  setField(functionScope.fields, 'count', String(countAfterFirstCall))
  const incrementMemory = runtime.memory.find((card) => card.id === 'increment-function')
  if (incrementMemory) {
    setField(incrementMemory.fields, 'captured count', String(countAfterFirstCall))
  }
  runtime.consoleLines.push(String(countAfterFirstCall))

  captureStep(snapshots, runtime, {
    title: 'Captured value mutates',
    explanation: `count increments to ${countAfterFirstCall} and logs to console.`,
    focusLine: findLine(code, 'count += 1') ?? findLine(code, 'count++'),
  })

  runtime.callStack.pop()

  captureStep(snapshots, runtime, {
    title: 'First call returns',
    explanation: 'increment() is popped, but closure state remains in lexical scope memory.',
    focusLine: null,
  })

  runtime.callStack.push({
    id: 'counter-call-2',
    label: 'counter() -> increment()',
    detail: 'second invocation',
  })

  captureStep(snapshots, runtime, {
    title: 'Second closure invocation',
    explanation: 'Calling counter() again reuses the same captured count variable.',
    focusLine: findLine(code, 'counter();'),
  })

  const countAfterSecondCall = countAfterFirstCall + 1
  setField(functionScope.fields, 'count', String(countAfterSecondCall))
  if (incrementMemory) {
    setField(incrementMemory.fields, 'captured count', String(countAfterSecondCall))
  }
  runtime.consoleLines.push(String(countAfterSecondCall))

  captureStep(snapshots, runtime, {
    title: 'Shared closure state persists',
    explanation:
      'The same lexical environment is updated again, proving closure state is persistent between calls.',
    focusLine: findLine(code, 'console.log(count)'),
  })

  runtime.callStack.pop()
  runtime.callStack.pop()

  captureStep(snapshots, runtime, {
    title: 'Program idle',
    explanation: 'Execution ends with closure scope still visible for learning purposes.',
    focusLine: null,
  })

  return snapshots
}

export function buildAsyncAwaitTimeline(code: string): RuntimeSnapshot[] {
  const snapshots: RuntimeSnapshot[] = []
  const runtime = buildBaseRuntime()

  const scriptStartLog =
    parseStringLiteral(
      code.match(/console\.log\((['"`])script start\1\)/)?.[0]?.split('(')[1]?.slice(0, -1),
      'script start',
    ) || 'script start'
  const scriptEndLog =
    parseStringLiteral(
      code.match(/console\.log\((['"`])script end\1\)/)?.[0]?.split('(')[1]?.slice(0, -1),
      'script end',
    ) || 'script end'

  const awaitedValue =
    parseStringLiteral(code.match(/await\s+Promise\.resolve\(([^)]+)\)/)?.[1], 'resolved value') ||
    'resolved value'

  const insideAsyncLog =
    parseStringLiteral(
      code
        .match(/async\s+function\s+\w+\s*\([^)]*\)\s*{[\s\S]*?console\.log\(([^)]+)\)/)?.[1],
      'inside async before await',
    ) || 'inside async before await'

  const resumedTemplate =
    parseStringLiteral(
      code
        .match(/await[\s\S]*?console\.log\(([^)]+)\)/)?.[1],
      'inside async after await',
    ) || 'inside async after await'

  const resumedLog = resumedTemplate.replaceAll('${value}', awaitedValue)

  const timeoutLog =
    parseStringLiteral(
      code.match(/setTimeout\(\(\)\s*=>\s*console\.log\(([^)]+)\)/)?.[1],
      'timeout callback',
    ) || 'timeout callback'

  const globalScope: MemoryCard = {
    id: 'async-global-memory',
    title: 'Global Scope',
    fields: [
      { key: 'runLesson', value: '<async function>' },
      { key: 'lessonPromise', value: '<pending>' },
      { key: 'result', value: 'uninitialized' },
    ],
  }

  const lexicalGlobalScope: MemoryCard = {
    id: 'async-lexical-global',
    title: 'Lexical Scope: global',
    fields: cloneMemoryFields(globalScope.fields),
  }

  runtime.memory.push(globalScope)
  runtime.lexicalScopes.push(lexicalGlobalScope)
  runtime.callStack.push({ id: 'async-global-frame', label: 'global()' })

  captureStep(snapshots, runtime, {
    title: 'Script enters global execution',
    explanation: 'The async function is declared and global execution starts.',
    focusLine: findLine(code, 'async function'),
  })

  runtime.callStack.push({ id: 'async-start-log-frame', label: 'console.log(script start)' })
  runtime.consoleLines.push(scriptStartLog)

  captureStep(snapshots, runtime, {
    title: 'Synchronous start log',
    explanation: 'Top-level synchronous code executes first.',
    focusLine: findLine(code, 'script start'),
  })

  runtime.callStack.pop()
  runtime.callStack.push({ id: 'run-lesson-frame', label: 'runLesson()' })

  const runLessonScope: MemoryCard = {
    id: 'run-lesson-scope',
    title: 'Lexical Scope: runLesson',
    fields: [
      { key: 'value', value: 'uninitialized' },
      { key: 'state', value: 'running' },
    ],
  }

  runtime.lexicalScopes.push(runLessonScope)
  setField(globalScope.fields, 'lessonPromise', '<pending, awaiting Promise.resolve>')
  setField(
    lexicalGlobalScope.fields,
    'lessonPromise',
    '<pending, awaiting Promise.resolve>',
  )

  captureStep(snapshots, runtime, {
    title: 'Async function invoked',
    explanation: 'runLesson() begins and immediately returns a pending promise to global scope.',
    focusLine: findLine(code, 'runLesson();'),
  })

  runtime.callStack.push({ id: 'inside-async-log-frame', label: 'console.log(async start)' })
  runtime.consoleLines.push(insideAsyncLog)

  captureStep(snapshots, runtime, {
    title: 'Inside async: pre-await log',
    explanation: 'Code before await runs synchronously while runLesson is still on the stack.',
    focusLine: findLine(code, 'inside async') ?? findLine(code, 'console.log('),
  })

  runtime.callStack.pop()
  runtime.microtaskQueue.push({
    id: 'await-resume-microtask',
    label: 'runLesson continuation',
    detail: 'resume after await Promise.resolve(...)',
  })
  setField(runLessonScope.fields, 'state', 'suspended at await')

  captureStep(snapshots, runtime, {
    title: 'Await suspends function',
    explanation:
      'await pauses runLesson and schedules its continuation in the microtask queue.',
    focusLine: findLine(code, 'await Promise.resolve'),
  })

  runtime.callStack.pop()
  runtime.webApis.push({
    id: 'async-timeout',
    label: 'timeout callback',
    detail: 'due at 0ms',
  })

  captureStep(snapshots, runtime, {
    title: 'Timer scheduled in parallel',
    explanation: 'Global code keeps running and delegates setTimeout to Web APIs.',
    focusLine: findLine(code, 'setTimeout'),
  })

  runtime.callStack.push({ id: 'async-end-log-frame', label: 'console.log(script end)' })
  runtime.consoleLines.push(scriptEndLog)

  captureStep(snapshots, runtime, {
    title: 'Synchronous end log',
    explanation:
      'script end logs before the awaited continuation because microtasks run after current stack clears.',
    focusLine: findLine(code, 'script end'),
  })

  runtime.callStack.pop()
  runtime.callStack.pop()

  captureStep(snapshots, runtime, {
    title: 'Global stack frame exits',
    explanation: 'The event loop can now drain microtasks before macrotasks.',
    focusLine: null,
  })

  runtime.microtaskQueue.shift()
  runtime.callStack.push({ id: 'run-lesson-resume-frame', label: 'runLesson() resume' })
  setField(runLessonScope.fields, 'state', 'resumed after await')
  setField(runLessonScope.fields, 'value', awaitedValue)
  setField(globalScope.fields, 'result', awaitedValue)
  setField(lexicalGlobalScope.fields, 'result', awaitedValue)

  captureStep(snapshots, runtime, {
    title: 'Await continuation runs as microtask',
    explanation:
      'The awaited promise is fulfilled, so runLesson resumes from await with the resolved value.',
    focusLine: findLine(code, 'const value = await'),
  })

  runtime.callStack.push({ id: 'async-resumed-log-frame', label: 'console.log(resumed)' })
  runtime.consoleLines.push(resumedLog)

  captureStep(snapshots, runtime, {
    title: 'Post-await log executes',
    explanation: 'Code after await runs during microtask processing, before timeout callbacks.',
    focusLine: findLine(code, 'await resumed') ?? findLine(code, 'console.log(`'),
  })

  runtime.callStack.pop()
  runtime.callStack.pop()
  setField(runLessonScope.fields, 'state', 'completed')
  setField(globalScope.fields, 'lessonPromise', '<fulfilled>')
  setField(lexicalGlobalScope.fields, 'lessonPromise', '<fulfilled>')

  captureStep(snapshots, runtime, {
    title: 'Async function promise fulfilled',
    explanation: 'runLesson completes and its returned promise is fulfilled.',
    focusLine: null,
  })

  runtime.webApis = runtime.webApis.filter((item) => item.id !== 'async-timeout')
  runtime.callbackQueue.push({
    id: 'async-timeout-callback',
    label: 'timeout callback',
    detail: 'macrotask ready',
  })

  captureStep(snapshots, runtime, {
    title: 'Timer callback queued',
    explanation: 'After microtasks finish, the timer callback enters the callback queue.',
    focusLine: findLine(code, 'setTimeout'),
  })

  runtime.callbackQueue.shift()
  runtime.callStack.push({ id: 'async-timeout-frame', label: 'timeout callback' })
  runtime.consoleLines.push(timeoutLog)

  captureStep(snapshots, runtime, {
    title: 'Timeout callback executes last',
    explanation: 'Macrotask callback runs only after microtask queue is empty.',
    focusLine: findLine(code, 'timeout callback') ?? findLine(code, 'setTimeout'),
  })

  runtime.callStack.pop()

  captureStep(snapshots, runtime, {
    title: 'Runtime idle',
    explanation: 'All queues are empty and execution is complete.',
    focusLine: null,
  })

  return snapshots
}
