import type { RuntimeSnapshot } from '../simulator/types'
import { motion } from 'framer-motion'

type TimelinePanelProps = {
  snapshots: RuntimeSnapshot[]
  currentStep: number
  onStepSelect: (step: number) => void
}

function aroundCurrent(snapshots: RuntimeSnapshot[], currentStep: number) {
  const start = Math.max(0, currentStep - 3)
  const end = Math.min(snapshots.length, currentStep + 4)
  return snapshots.slice(start, end)
}

export function TimelinePanel({
  snapshots,
  currentStep,
  onStepSelect,
}: TimelinePanelProps) {
  const current = snapshots[currentStep]
  const nearby = aroundCurrent(snapshots, currentStep)

  return (
    <div className="timeline-panel">
      <div className="timeline-head">
        <h2>Timeline</h2>
        {current ? (
          <p>
            {current.title} ({current.clock}ms)
          </p>
        ) : (
          <p>No timeline yet.</p>
        )}
      </div>

      <input
        type="range"
        min={0}
        max={Math.max(0, snapshots.length - 1)}
        step={1}
        value={Math.min(currentStep, Math.max(0, snapshots.length - 1))}
        onChange={(event) => onStepSelect(Number(event.target.value))}
      />

      <div className="timeline-list">
        {nearby.map((snapshot) => {
          const isActive = snapshot.id === currentStep
          return (
            <motion.button
              layout
              key={snapshot.id}
              type="button"
              className={`timeline-item ${isActive ? 'active' : ''}`}
              onClick={() => onStepSelect(snapshot.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
            >
              <span>{snapshot.id + 1}</span>
              <strong>{snapshot.title}</strong>
              <small>{snapshot.clock}ms</small>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
