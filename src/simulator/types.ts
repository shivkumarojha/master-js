export type StackFrame = {
  id: string
  label: string
  detail?: string
}

export type LaneItem = {
  id: string
  label: string
  detail?: string
}

export type MemoryField = {
  key: string
  value: string
}

export type MemoryCard = {
  id: string
  title: string
  fields: MemoryField[]
}

export type RuntimeSnapshot = {
  id: number
  clock: number
  title: string
  explanation: string
  focusLine: number | null
  callStack: StackFrame[]
  webApis: LaneItem[]
  callbackQueue: LaneItem[]
  microtaskQueue: LaneItem[]
  consoleLines: string[]
  memory: MemoryCard[]
  lexicalScopes: MemoryCard[]
}

export type LessonId =
  | 'rectangle-basics'
  | 'event-loop-click'
  | 'promises'
  | 'closures'
  | 'async-await'

export type LessonDefinition = {
  id: LessonId
  title: string
  summary: string
  concepts: string[]
  starterCode: string
  buildTimeline: (code: string) => RuntimeSnapshot[]
}
