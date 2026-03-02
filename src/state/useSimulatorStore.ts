import { create } from 'zustand'
import { defaultLessonId, lessonCatalog } from '../lessons/catalog'
import type { LessonId, RuntimeSnapshot } from '../simulator/types'

type PlaybackStatus = 'paused' | 'running'

type SimulatorStore = {
  lessonId: LessonId
  code: string
  snapshots: RuntimeSnapshot[]
  currentStep: number
  playbackStatus: PlaybackStatus
  speedMs: number
  setLesson: (lessonId: LessonId) => void
  setCode: (value: string) => void
  rebuild: () => void
  run: () => void
  pause: () => void
  reset: () => void
  stepForward: () => void
  stepBack: () => void
  setStep: (step: number) => void
  setSpeedMs: (value: number) => void
}

function getLesson(lessonId: LessonId) {
  return lessonCatalog.find((lesson) => lesson.id === lessonId) ?? lessonCatalog[0]
}

const initialLesson = getLesson(defaultLessonId)
const initialSnapshots = initialLesson.buildTimeline(initialLesson.starterCode)

export const useSimulatorStore = create<SimulatorStore>((set, get) => ({
  lessonId: initialLesson.id,
  code: initialLesson.starterCode,
  snapshots: initialSnapshots,
  currentStep: 0,
  playbackStatus: 'paused',
  speedMs: 2500,

  setLesson: (lessonId) => {
    const lesson = getLesson(lessonId)
    const snapshots = lesson.buildTimeline(lesson.starterCode)

    set({
      lessonId,
      code: lesson.starterCode,
      snapshots,
      currentStep: 0,
      playbackStatus: 'paused',
    })
  },

  setCode: (value) => {
    set({ code: value })
  },

  rebuild: () => {
    const lesson = getLesson(get().lessonId)
    const snapshots = lesson.buildTimeline(get().code)
    set({
      snapshots,
      currentStep: 0,
      playbackStatus: 'paused',
    })
  },

  run: () => {
    set((state) => {
      const lastIndex = Math.max(0, state.snapshots.length - 1)
      if (state.currentStep >= lastIndex) {
        return {
          currentStep: 0,
          playbackStatus: 'running',
        }
      }

      return { playbackStatus: 'running' }
    })
  },

  pause: () => {
    set({ playbackStatus: 'paused' })
  },

  reset: () => {
    set({ currentStep: 0, playbackStatus: 'paused' })
  },

  stepForward: () => {
    set((state) => {
      const lastIndex = Math.max(0, state.snapshots.length - 1)
      if (state.currentStep >= lastIndex) {
        return {
          currentStep: lastIndex,
          playbackStatus: 'paused',
        }
      }

      return {
        currentStep: state.currentStep + 1,
      }
    })
  },

  stepBack: () => {
    set((state) => ({
      currentStep: Math.max(0, state.currentStep - 1),
      playbackStatus: 'paused',
    }))
  },

  setStep: (step) => {
    set((state) => {
      const maxStep = Math.max(0, state.snapshots.length - 1)
      const next = Math.min(Math.max(0, step), maxStep)
      return {
        currentStep: next,
        playbackStatus: 'paused',
      }
    })
  },

  setSpeedMs: (value) => {
    set({ speedMs: value })
  },
}))
