import { motion } from 'framer-motion'
import {
  flowNodeName,
  type FlowNodeKey,
  type FlowTransition,
} from '../simulator/transitions'

type FlowPulseProps = {
  stepId: number
  transition: FlowTransition | null
}

function laneClass(node: FlowNodeKey) {
  if (node === 'runtime') {
    return 'runtime'
  }
  if (node === 'completed') {
    return 'completed'
  }
  if (node === 'callStack') {
    return 'call-stack'
  }
  if (node === 'eventLoop') {
    return 'event-loop'
  }
  if (node === 'console') {
    return 'console'
  }
  if (node === 'webApis') {
    return 'web-apis'
  }
  if (node === 'callbackQueue') {
    return 'callback-queue'
  }
  return 'microtask-queue'
}

export function FlowPulse({ stepId, transition }: FlowPulseProps) {
  if (!transition) {
    return (
      <div className="flow-pulse empty">
        <p>No lane movement in this frame.</p>
      </div>
    )
  }

  return (
    <motion.div
      key={`${stepId}-${transition.itemId}-${transition.from}-${transition.to}`}
      className="flow-pulse"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="flow-pulse-head">
        <span className={`flow-node ${laneClass(transition.from)}`}>
          {flowNodeName(transition.from)}
        </span>
        <span className="flow-arrow">{'->'}</span>
        <span className={`flow-node ${laneClass(transition.to)}`}>
          {flowNodeName(transition.to)}
        </span>
        <strong>{transition.label}</strong>
      </div>

      <div className="flow-track" aria-hidden="true">
        <motion.div
          className="flow-dot"
          initial={{ x: 0, opacity: 0.25 }}
          animate={{ x: 'calc(100% - 14px)', opacity: 1 }}
          transition={{ duration: 0.75, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  )
}
