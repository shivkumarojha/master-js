import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import './App.css'
import { CodeEditor } from './components/CodeEditor'
import { ControlBar } from './components/ControlBar'
import {
  ClockIcon,
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
  const DEFAULT_LEFT_PANE_WIDTH = 48
  const DEFAULT_TOP_PANE_VH = 92

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
  const [showClockReadout, setShowClockReadout] = useState(false)
  const [leftPaneWidth, setLeftPaneWidth] = useState(DEFAULT_LEFT_PANE_WIDTH)
  const [topPaneHeight, setTopPaneHeight] = useState(DEFAULT_TOP_PANE_VH)

  const focusGridRef = useRef<HTMLElement | null>(null)
  const appMainRef = useRef<HTMLDivElement | null>(null)

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

  const startVerticalResize = () => {
    const host = focusGridRef.current
    if (!host) {
      return
    }

    const rect = host.getBoundingClientRect()
    const minPercent = 28
    const maxPercent = 72

    const onMouseMove = (event: MouseEvent) => {
      const raw = ((event.clientX - rect.left) / rect.width) * 100
      const clamped = Math.min(maxPercent, Math.max(minPercent, raw))
      setLeftPaneWidth(clamped)
    }

    const stop = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', stop)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', stop)
  }

  const startHorizontalResize = () => {
    const host = appMainRef.current
    if (!host) {
      return
    }

    const rect = host.getBoundingClientRect()
    const minPercent = 56
    const maxPercent = 94

    const onMouseMove = (event: MouseEvent) => {
      const raw = ((event.clientY - rect.top) / window.innerHeight) * 100
      const clamped = Math.min(maxPercent, Math.max(minPercent, raw))
      setTopPaneHeight(clamped)
    }

    const stop = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', stop)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', stop)
  }

  const resetVerticalSplit = () => {
    setLeftPaneWidth(DEFAULT_LEFT_PANE_WIDTH)
  }

  const resetHorizontalSplit = () => {
    setTopPaneHeight(DEFAULT_TOP_PANE_VH)
  }

  const appMainStyle = {
    '--top-pane-vh': `${topPaneHeight}vh`,
    '--left-pane-width': `${leftPaneWidth}%`,
  } as CSSProperties

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

          <span className="rail-divider" />

          <button
            type="button"
            className="rail-icon-button"
            aria-label="Show current timeline time"
            onClick={() => setShowClockReadout((state) => !state)}
            title="Show current time"
          >
            <ClockIcon />
          </button>

          {showClockReadout ? (
            <p className="rail-time-readout" aria-live="polite">
              {currentSnapshot?.clock ?? 0}ms
            </p>
          ) : null}

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

      <div ref={appMainRef} className="app-main" style={appMainStyle}>
        <main ref={focusGridRef} className="focus-grid">
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

          <div
            className="splitter splitter-vertical"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize code and visualization panels"
            onMouseDown={startVerticalResize}
            onDoubleClick={resetVerticalSplit}
            title="Drag to resize. Double-click to reset."
          >
            <span />
          </div>

          <section className="panel panel-runtime">
            {currentSnapshot ? (
              <RuntimeBoard snapshot={currentSnapshot} transition={activeTransition} />
            ) : (
              <p className="empty-state">No simulation steps available yet.</p>
            )}
          </section>
        </main>

        <div
          className="splitter splitter-horizontal"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize visualization and timeline panels"
          onMouseDown={startHorizontalResize}
          onDoubleClick={resetHorizontalSplit}
          title="Drag to resize. Double-click to reset."
        >
          <span />
        </div>

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
