import type { ReactNode } from 'react'
import {
  ClockIcon,
  FlowIcon,
  PauseIcon,
  PlayIcon,
  RefreshIcon,
  ResetIcon,
  SparkIcon,
  SpeedIcon,
  StepBackIcon,
  StepForwardIcon,
  StepIcon,
} from './Icons'

type ControlBarProps = {
  playbackStatus: 'paused' | 'running'
  speedMs: number
  currentStep: number
  totalSteps: number
  currentClock: number
  currentTitle: string
  transitionSummary: string
  onRun: () => void
  onPause: () => void
  onReset: () => void
  onStepForward: () => void
  onStepBack: () => void
  onRebuild: () => void
  onSpeedChange: (value: number) => void
}

function IconLabel({
  icon,
  children,
}: {
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <span className="icon-label">
      {icon}
      {children}
    </span>
  )
}

export function ControlBar({
  playbackStatus,
  speedMs,
  currentStep,
  totalSteps,
  currentClock,
  currentTitle,
  transitionSummary,
  onRun,
  onPause,
  onReset,
  onStepForward,
  onStepBack,
  onRebuild,
  onSpeedChange,
}: ControlBarProps) {
  const speedPresets = [500, 1200, 2500, 5000, 10000, 15000, 20000]

  return (
    <div className="control-bar">
      <div className="control-status-row">
        <p className="status-pill">
          <ClockIcon />
          <span>{currentClock}ms</span>
        </p>

        <p className="status-pill">
          <StepIcon />
          <span>
            Step {Math.min(currentStep + 1, Math.max(totalSteps, 1))} /{' '}
            {Math.max(totalSteps, 1)}
          </span>
        </p>

        <p className="status-pill wide">
          <SparkIcon />
          <span>{currentTitle}</span>
        </p>
      </div>

      <p className="movement-pill">
        <FlowIcon />
        <span>{transitionSummary}</span>
      </p>

      <div className="control-main-row">
        <div className="control-buttons">
          <button type="button" onClick={onRebuild}>
            <IconLabel icon={<RefreshIcon />}>Rebuild</IconLabel>
          </button>
          <button type="button" onClick={onReset}>
            <IconLabel icon={<ResetIcon />}>Reset</IconLabel>
          </button>
          <button type="button" onClick={onStepBack}>
            <IconLabel icon={<StepBackIcon />}>Step Back</IconLabel>
          </button>
          <button type="button" onClick={onStepForward}>
            <IconLabel icon={<StepForwardIcon />}>Step Forward</IconLabel>
          </button>
          {playbackStatus === 'running' ? (
            <button type="button" onClick={onPause}>
              <IconLabel icon={<PauseIcon />}>Pause</IconLabel>
            </button>
          ) : (
            <button type="button" onClick={onRun}>
              <IconLabel icon={<PlayIcon />}>Run</IconLabel>
            </button>
          )}
        </div>

        <div className="speed-controls">
          <label htmlFor="speed-slider">
            <IconLabel icon={<SpeedIcon />}>
              Speed: {speedMs}ms ({(speedMs / 1000).toFixed(1)}s)
            </IconLabel>
          </label>

          <input
            id="speed-slider"
            type="range"
            min={300}
            max={24000}
            step={100}
            value={speedMs}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
          />

          <div className="speed-presets">
            {speedPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                className={speedMs === preset ? 'active' : ''}
                onClick={() => onSpeedChange(preset)}
              >
                {preset >= 1000 ? `${(preset / 1000).toFixed(1)}s` : `${preset}ms`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
