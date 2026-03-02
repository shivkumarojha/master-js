import { AnimatePresence, motion } from 'framer-motion'
import type { RuntimeSnapshot } from '../simulator/types'
import type { FlowNodeKey, FlowTransition } from '../simulator/transitions'
import { FlowPulse } from './FlowPulse'

type RuntimeBoardProps = {
  snapshot: RuntimeSnapshot
  transition: FlowTransition | null
}

type DisplayItem = {
  id: string
  label: string
  detail?: string
}

const FLOW_NODES: Record<FlowNodeKey, { label: string; x: number; y: number }> = {
  runtime: { label: 'Script', x: 12, y: 20 },
  webApis: { label: 'Web APIs', x: 28, y: 55 },
  callbackQueue: { label: 'Callback Queue', x: 48, y: 55 },
  microtaskQueue: { label: 'Microtasks', x: 48, y: 74 },
  eventLoop: { label: 'Event Loop', x: 70, y: 57 },
  callStack: { label: 'Call Stack', x: 88, y: 36 },
  console: { label: 'Console', x: 88, y: 61 },
  completed: { label: 'Completed', x: 88, y: 82 },
}

const BASE_EDGES: Array<[FlowNodeKey, FlowNodeKey]> = [
  ['runtime', 'callStack'],
  ['runtime', 'webApis'],
  ['runtime', 'microtaskQueue'],
  ['webApis', 'callbackQueue'],
  ['callbackQueue', 'eventLoop'],
  ['microtaskQueue', 'eventLoop'],
  ['eventLoop', 'callStack'],
  ['callStack', 'console'],
  ['callStack', 'completed'],
]

function edgeKey(from: FlowNodeKey, to: FlowNodeKey) {
  return `${from}-${to}`
}

function LanePanel({
  title,
  lane,
  items,
  transition,
}: {
  title: string
  lane: FlowNodeKey
  items: DisplayItem[]
  transition: FlowTransition | null
}) {
  const isActive = transition?.from === lane || transition?.to === lane
  const displayItems = lane === 'callStack' ? [...items].reverse() : items

  return (
    <motion.article
      layout
      className={`runtime-panel ${isActive ? 'lane-active' : ''}`}
      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
    >
      <h3>{title}</h3>
      {displayItems.length === 0 ? (
        <p className="empty">Empty</p>
      ) : (
        <motion.ul layout>
          <AnimatePresence mode="popLayout">
            {displayItems.map((item, index) => (
              <motion.li
                layout
                key={item.id}
                className={lane === 'callStack' && index === 0 ? 'stack-top' : ''}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <strong>{item.label}</strong>
                {item.detail ? <span>{item.detail}</span> : null}
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </motion.article>
  )
}

function transitionEdges(transition: FlowTransition | null): Set<string> {
  if (!transition) {
    return new Set()
  }

  if (transition.from === 'callbackQueue' && transition.to === 'callStack') {
    return new Set([
      edgeKey('callbackQueue', 'eventLoop'),
      edgeKey('eventLoop', 'callStack'),
    ])
  }

  if (transition.from === 'microtaskQueue' && transition.to === 'callStack') {
    return new Set([
      edgeKey('microtaskQueue', 'eventLoop'),
      edgeKey('eventLoop', 'callStack'),
    ])
  }

  if (transition.from === 'runtime' && transition.to === 'callbackQueue') {
    return new Set([
      edgeKey('runtime', 'webApis'),
      edgeKey('webApis', 'callbackQueue'),
    ])
  }

  return new Set([edgeKey(transition.from, transition.to)])
}

function tracerPath(
  transition: FlowTransition | null,
): { left: string[]; top: string[] } | null {
  if (!transition) {
    return null
  }

  const source = FLOW_NODES[transition.from]
  const target = FLOW_NODES[transition.to]
  if (!source || !target) {
    return null
  }

  if (transition.from === 'callbackQueue' && transition.to === 'callStack') {
    const loop = FLOW_NODES.eventLoop
    return {
      left: [`${source.x}%`, `${loop.x}%`, `${target.x}%`],
      top: [`${source.y}%`, `${loop.y}%`, `${target.y}%`],
    }
  }

  if (transition.from === 'microtaskQueue' && transition.to === 'callStack') {
    const loop = FLOW_NODES.eventLoop
    return {
      left: [`${source.x}%`, `${loop.x}%`, `${target.x}%`],
      top: [`${source.y}%`, `${loop.y}%`, `${target.y}%`],
    }
  }

  if (transition.from === 'runtime' && transition.to === 'callbackQueue') {
    const webApis = FLOW_NODES.webApis
    return {
      left: [`${source.x}%`, `${webApis.x}%`, `${target.x}%`],
      top: [`${source.y}%`, `${webApis.y}%`, `${target.y}%`],
    }
  }

  return {
    left: [`${source.x}%`, `${target.x}%`],
    top: [`${source.y}%`, `${target.y}%`],
  }
}

export function RuntimeBoard({ snapshot, transition }: RuntimeBoardProps) {
  const movementKey = transition
    ? `${transition.itemId}-${transition.from}-${transition.to}-${snapshot.id}`
    : `no-move-${snapshot.id}`

  const activeEdges = transitionEdges(transition)
  const isEventLoopActive =
    transition?.from === 'callbackQueue' ||
    transition?.from === 'microtaskQueue' ||
    transition?.to === 'eventLoop'

  const activeConsoleLane = transition?.from === 'console' || transition?.to === 'console'
  const path = tracerPath(transition)

  return (
    <div className="runtime-board">
      <section className="flow-map-wrapper">
        <svg className="flow-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {BASE_EDGES.map(([from, to]) => (
            <line
              key={edgeKey(from, to)}
              x1={FLOW_NODES[from].x}
              y1={FLOW_NODES[from].y}
              x2={FLOW_NODES[to].x}
              y2={FLOW_NODES[to].y}
              className={activeEdges.has(edgeKey(from, to)) ? 'flow-edge active' : 'flow-edge'}
            />
          ))}
        </svg>

        {Object.entries(FLOW_NODES).map(([nodeKey, node]) => {
          const isActive =
            transition?.from === nodeKey ||
            transition?.to === nodeKey ||
            (nodeKey === 'eventLoop' && isEventLoopActive)

          return (
            <motion.div
              key={nodeKey}
              className={`flow-node-badge ${isActive ? 'active' : ''}`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              animate={isActive ? { scale: 1.08 } : { scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <span>{node.label}</span>
            </motion.div>
          )
        })}

        {path ? (
          <motion.div
            key={`${movementKey}-token`}
            className="flow-tracer"
            initial={{ left: path.left[0], top: path.top[0], opacity: 0.35, scale: 0.8 }}
            animate={{ left: path.left, top: path.top, opacity: 1, scale: 1 }}
            transition={{ duration: 0.62, ease: 'easeInOut' }}
          />
        ) : null}
      </section>
      {/**/}
      {/* <p className="flow-map-caption"> */}
      {/*   {transition */}
      {/*     ? `Current movement: ${transition.label} (${FLOW_NODES[transition.from].label} -> ${FLOW_NODES[transition.to].label})` */}
      {/*     : 'Current movement: no lane transfer in this frame'} */}
      {/* </p> */}
      {/**/}
      {/* <p className="eventloop-note"> */}
      {/*   Event loop concept: when the call stack is empty, microtasks run first, then callback queue tasks. */}
      {/* </p> */}
      {/**/}
      {/* <FlowPulse stepId={snapshot.id} transition={transition} /> */}
      {/**/}
      {/* <motion.p */}
      {/*   key={`explanation-${snapshot.id}`} */}
      {/*   className="runtime-explainer" */}
      {/*   initial={{ opacity: 0, x: 8 }} */}
      {/*   animate={{ opacity: 1, x: 0 }} */}
      {/*   transition={{ duration: 0.18, ease: 'easeOut' }} */}
      {/* > */}
      {/*   {snapshot.explanation} */}
      {/* </motion.p> */}
      {/**/}
      <div className="runtime-grid">
        <LanePanel
          title="Call Stack"
          lane="callStack"
          items={snapshot.callStack}
          transition={transition}
        />
        <LanePanel
          title="Web APIs"
          lane="webApis"
          items={snapshot.webApis}
          transition={transition}
        />
        <LanePanel
          title="Microtask Queue"
          lane="microtaskQueue"
          items={snapshot.microtaskQueue}
          transition={transition}
        />
        <LanePanel
          title="Callback Queue"
          lane="callbackQueue"
          items={snapshot.callbackQueue}
          transition={transition}
        />

        <motion.article layout className="runtime-panel">
          <h3>Memory</h3>
          {snapshot.memory.length === 0 ? (
            <p className="empty">No objects tracked</p>
          ) : (
            <motion.ul layout>
              <AnimatePresence mode="popLayout">
                {snapshot.memory.map((card) => (
                  <motion.li
                    layout
                    key={card.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  >
                    <strong>{card.title}</strong>
                    <span>
                      {card.fields.map((field) => `${field.key}: ${field.value}`).join(' | ')}
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </motion.article>

        <motion.article layout className="runtime-panel">
          <h3>Lexical Scopes</h3>
          {snapshot.lexicalScopes.length === 0 ? (
            <p className="empty">No lexical scopes active</p>
          ) : (
            <motion.ul layout>
              <AnimatePresence mode="popLayout">
                {snapshot.lexicalScopes.map((scope) => (
                  <motion.li
                    layout
                    key={scope.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  >
                    <strong>{scope.title}</strong>
                    <span>
                      {scope.fields.map((field) => `${field.key}: ${field.value}`).join(' | ')}
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </motion.article>

        <motion.article
          layout
          className={`runtime-panel console-panel ${activeConsoleLane ? 'lane-active' : ''}`}
        >
          <h3>Console Output</h3>
          {snapshot.consoleLines.length === 0 ? (
            <p className="empty">No logs yet</p>
          ) : (
            <motion.ol layout>
              <AnimatePresence>
                {snapshot.consoleLines.map((line, index) => (
                  <motion.li
                    layout
                    key={`${line}-${index}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                  >
                    {line}
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ol>
          )}
        </motion.article>
      </div>
    </div>
  )
}
