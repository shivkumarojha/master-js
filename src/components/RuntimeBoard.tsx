import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { FlowIcon, LayersIcon } from './Icons'
import type { RuntimeSnapshot } from '../simulator/types'
import type { FlowTransition } from '../simulator/transitions'

type RuntimeBoardProps = {
  snapshot: RuntimeSnapshot
  transition: FlowTransition | null
}

type RuntimeView = 'flow' | 'state'

type Item = {
  id: string
  label: string
  detail?: string
}

function CompactLane({
  title,
  items,
  tone,
  active,
}: {
  title: string
  items: Item[]
  tone: 'stack' | 'web' | 'micro' | 'callback' | 'console'
  active: boolean
}) {
  const displayItems = title === 'Call Stack' ? [...items].reverse() : items

  return (
    <motion.article
      layout
      className={`lane-card tone-${tone} ${active ? 'active' : ''}`}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
    >
      <h3>{title}</h3>
      {displayItems.length === 0 ? (
        <p className="empty">Empty</p>
      ) : (
        <ul>
          {displayItems.map((item, index) => (
            <li key={item.id} className={title === 'Call Stack' && index === 0 ? 'stack-top' : ''}>
              <strong>{item.label}</strong>
              {item.detail ? <span>{item.detail}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </motion.article>
  )
}

function StateCard({ title, lines }: { title: string; lines: Array<{ key: string; value: string }> }) {
  return (
    <article className="state-card">
      <h3>{title}</h3>
      {lines.length === 0 ? (
        <p className="empty">No data</p>
      ) : (
        <ul>
          {lines.map((line) => (
            <li key={line.key}>
              <strong>{line.key}</strong>
              <span>{line.value}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export function RuntimeBoard({ snapshot, transition }: RuntimeBoardProps) {
  const [view, setView] = useState<RuntimeView>('flow')

  const movementText = transition
    ? `${transition.from} -> ${transition.to} (${transition.label})`
    : 'No lane transfer in this frame'

  const eventLoopActive =
    transition?.from === 'callbackQueue' || transition?.from === 'microtaskQueue'

  const memoryLines = useMemo(
    () =>
      snapshot.memory.map((card) => ({
        key: card.title,
        value: card.fields.map((field) => `${field.key}: ${field.value}`).join(' | '),
      })),
    [snapshot.memory],
  )

  const lexicalLines = useMemo(
    () =>
      snapshot.lexicalScopes.map((scope) => ({
        key: scope.title,
        value: scope.fields.map((field) => `${field.key}: ${field.value}`).join(' | '),
      })),
    [snapshot.lexicalScopes],
  )

  const consoleLines = useMemo(
    () =>
      snapshot.consoleLines.map((line, index) => ({
        key: `${index + 1}`,
        value: line,
      })),
    [snapshot.consoleLines],
  )

  return (
    <div className="runtime-board">
      <div className="runtime-view-switch" role="tablist" aria-label="Runtime panel view">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'flow'}
          className={view === 'flow' ? 'active' : ''}
          onClick={() => setView('flow')}
        >
          <FlowIcon />
          <span>Flow Lanes</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'state'}
          className={view === 'state' ? 'active' : ''}
          onClick={() => setView('state')}
        >
          <LayersIcon />
          <span>State Details</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {view === 'flow' ? (
          <motion.section
            key="flow-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flow-view"
          >
            <div className="flow-top-grid">
              <CompactLane
                title="Call Stack"
                items={snapshot.callStack}
                tone="stack"
                active={transition?.from === 'callStack' || transition?.to === 'callStack'}
              />

              <CompactLane
                title="Web APIs"
                items={snapshot.webApis}
                tone="web"
                active={transition?.from === 'webApis' || transition?.to === 'webApis'}
              />
            </div>

            <div className={`event-loop-row ${eventLoopActive ? 'active' : ''}`}>
              <motion.div
                className="event-loop-spinner"
                animate={{ rotate: 360 }}
                transition={{ duration: 2.6, ease: 'linear', repeat: Number.POSITIVE_INFINITY }}
              >
                ↻
              </motion.div>
              <div>
                <p>Event Loop</p>
                <small>When stack is empty: microtasks first, then callback queue.</small>
              </div>
            </div>

            <article
              className={`lane-card queue-combo ${
                transition?.from === 'callbackQueue' ||
                transition?.to === 'callbackQueue' ||
                transition?.from === 'microtaskQueue' ||
                transition?.to === 'microtaskQueue'
                  ? 'active'
                  : ''
              }`}
            >
              <div className="queue-combo-grid">
                <section className="queue-segment tone-micro">
                  <h3>Microtask Queue</h3>
                  {snapshot.microtaskQueue.length === 0 ? (
                    <p className="empty">Empty</p>
                  ) : (
                    <ul>
                      {snapshot.microtaskQueue.map((item) => (
                        <li key={item.id}>
                          <strong>{item.label}</strong>
                          {item.detail ? <span>{item.detail}</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="queue-segment tone-callback">
                  <h3>Callback Queue</h3>
                  {snapshot.callbackQueue.length === 0 ? (
                    <p className="empty">Empty</p>
                  ) : (
                    <ul>
                      {snapshot.callbackQueue.map((item) => (
                        <li key={item.id}>
                          <strong>{item.label}</strong>
                          {item.detail ? <span>{item.detail}</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </article>

            <CompactLane
              title="Console Output"
              items={snapshot.consoleLines.map((line, index) => ({
                id: `console-${index}-${line}`,
                label: line,
              }))}
              tone="console"
              active={transition?.from === 'console' || transition?.to === 'console'}
            />

            <p className="runtime-explainer">{snapshot.explanation}</p>
            <p className="flow-map-caption">Current movement: {movementText}</p>
          </motion.section>
        ) : (
          <motion.section
            key="state-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="state-view"
          >
            <div className="state-grid">
              <StateCard title="Memory" lines={memoryLines} />
              <StateCard title="Lexical Scopes" lines={lexicalLines} />
              <StateCard title="Console Output" lines={consoleLines} />
            </div>
            <p className="runtime-explainer">{snapshot.explanation}</p>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
