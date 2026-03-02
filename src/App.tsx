import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { CodeEditor } from './components/CodeEditor'
import { ControlBar } from './components/ControlBar'
import {
  BookIcon,
  FlowIcon,
  LayersIcon,
  MenuIcon,
  PauseIcon,
  PlayIcon,
  RefreshIcon,
  ResetIcon,
  SparkIcon,
  SpeedIcon,
  StepBackIcon,
  StepForwardIcon,
} from './components/Icons'
import { RuntimeBoard } from './components/RuntimeBoard'
import { TimelinePanel } from './components/TimelinePanel'
import { lessonCatalog } from './lessons/catalog'
import { detectFlowTransition, flowNodeName } from './simulator/transitions'
import type { LessonId } from './simulator/types'
import { useSimulatorStore } from './state/useSimulatorStore'

function App() {
  const {
    lessonId,
    code,
    snapshots,
    currentStep,
    playbackStatus,
    speedMs,
    setLesson,
    setCode,
    rebuild,
    run,
    pause,
    reset,
    stepForward,
    stepBack,
    setStep,
    setSpeedMs,
  } = useSimulatorStore()

  const [sidebarOpen, setSidebarOpen] = useState(false)

  const speedSteps = [500, 1200, 2500, 5000, 10000, 15000, 20000]

  const cycleSpeed = () => {
    const currentIndex = speedSteps.findIndex((value) => value === speedMs)
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % speedSteps.length : 0
    setSpeedMs(speedSteps[nextIndex])
  }

  const currentSnapshot = snapshots[currentStep] ?? snapshots[0]
  const previousSnapshot = currentStep > 0 ? snapshots[currentStep - 1] : undefined
  const activeLesson = lessonCatalog.find((lesson) => lesson.id === lessonId)
  const activeTransition = useMemo(
    () => detectFlowTransition(previousSnapshot, currentSnapshot),
    [previousSnapshot, currentSnapshot],
  )

  const transitionSummary = activeTransition
    ? `${flowNodeName(activeTransition.from)} -> ${flowNodeName(activeTransition.to)} (${activeTransition.label})`
    : 'No lane movement in this frame.'

  useEffect(() => {
    if (playbackStatus !== 'running') {
      return undefined
    }

    const timer = window.setTimeout(() => {
      stepForward()
    }, speedMs)

    return () => window.clearTimeout(timer)
  }, [playbackStatus, currentStep, speedMs, stepForward])

  return (
    <div className={`layout-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className="side-rail">
        <div className="rail-icons">
          <button
            type="button"
            className={`rail-icon-button ${sidebarOpen ? 'active' : ''}`}
            aria-label="Toggle sidebar"
            onClick={() => setSidebarOpen((state) => !state)}
            title="Toggle sidebar"
          >
            <MenuIcon />
          </button>

          <span className="rail-glyph" title="Lesson">
            <BookIcon />
          </span>
          <span className="rail-glyph" title="Flow">
            <FlowIcon />
          </span>
          <span className="rail-glyph" title="Concepts">
            <LayersIcon />
          </span>

          <span className="rail-divider" />

          <button
            type="button"
            className="rail-icon-button"
            aria-label={playbackStatus === 'running' ? 'Pause simulation' : 'Run simulation'}
            onClick={playbackStatus === 'running' ? pause : run}
            title={playbackStatus === 'running' ? 'Pause' : 'Run'}
          >
            {playbackStatus === 'running' ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button
            type="button"
            className="rail-icon-button"
            aria-label="Step forward"
            onClick={stepForward}
            title="Step forward"
          >
            <StepForwardIcon />
          </button>

          <button
            type="button"
            className="rail-icon-button"
            aria-label="Step back"
            onClick={stepBack}
            title="Step back"
          >
            <StepBackIcon />
          </button>

          <button
            type="button"
            className="rail-icon-button"
            aria-label="Reset timeline"
            onClick={reset}
            title="Reset"
          >
            <ResetIcon />
          </button>

          <button
            type="button"
            className="rail-icon-button"
            aria-label="Rebuild timeline"
            onClick={rebuild}
            title="Rebuild"
          >
            <RefreshIcon />
          </button>

          <button
            type="button"
            className="rail-icon-button"
            aria-label="Cycle speed"
            onClick={cycleSpeed}
            title={`Cycle speed (${(speedMs / 1000).toFixed(1)}s)`}
          >
            <SpeedIcon />
          </button>
        </div>

        <div className="rail-content">
          <h1>JS Visual Lab</h1>
          <p>One-frame-at-a-time explanation of runtime behavior.</p>

          <section className="rail-field">
            <label htmlFor="lesson-select">
              <LayersIcon />
              <span>Topic</span>
            </label>
            <select
              id="lesson-select"
              value={lessonId}
              onChange={(event) => setLesson(event.target.value as LessonId)}
            >
              {lessonCatalog.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>
          </section>

          <section className="rail-field">
            <label>
              <SparkIcon />
              <span>Concepts</span>
            </label>
            <div className="concept-chip-wrap">
              {activeLesson?.concepts.map((concept) => (
                <span key={concept} className="concept-chip">
                  {concept}
                </span>
              ))}
            </div>
          </section>

          <section className="rail-controls-wrap">
            <ControlBar
              playbackStatus={playbackStatus}
              speedMs={speedMs}
              currentStep={currentStep}
              totalSteps={snapshots.length}
              currentClock={currentSnapshot?.clock ?? 0}
              currentTitle={currentSnapshot?.title ?? 'No active frame'}
              transitionSummary={transitionSummary}
              onRun={run}
              onPause={pause}
              onReset={reset}
              onStepForward={stepForward}
              onStepBack={stepBack}
              onRebuild={rebuild}
              onSpeedChange={setSpeedMs}
            />
          </section>
        </div>
      </aside>

      <div className="app-main">
        <main className="focus-grid">
          <section className="panel panel-editor">
            <header className="playground-header">
              <h2>{activeLesson?.title}</h2>
              <p>{activeLesson?.summary}</p>
            </header>

            <CodeEditor
              code={code}
              focusLine={currentSnapshot?.focusLine ?? null}
              onChange={setCode}
            />
          </section>

          <section className="panel panel-runtime">
            {currentSnapshot ? (
              <RuntimeBoard snapshot={currentSnapshot} transition={activeTransition} />
            ) : (
              <p className="empty-state">No simulation steps available yet.</p>
            )}
          </section>
        </main>

        <section className="panel panel-timeline">
          <TimelinePanel
            snapshots={snapshots}
            currentStep={currentStep}
            onStepSelect={setStep}
          />
        </section>
      </div>
    </div>
  )
}

export default App
