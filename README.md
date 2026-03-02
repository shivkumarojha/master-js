# Master JS Visual Lab

Interactive React app to teach JavaScript execution diagrammatically.

The app visualizes:

- Call stack
- Web APIs (timers + DOM listeners)
- Callback queue (macrotasks)
- Microtask queue
- Console output
- Runtime memory snapshots

It includes slow playback controls (`Run`, `Pause`, `Step`, `Reset`, `Speed`) so learners can follow execution frame by frame.

## Tech Stack

- Vite + React + TypeScript
- Zustand for simulation state
- Monaco Editor for code editing
- Framer Motion for animated flow transitions
- Vitest for simulator ordering tests

## Run Locally

```bash
npm install
npm run dev
```

Then open the local URL shown in your terminal.

To run tests:

```bash
npm run test
```

## Available Lesson Presets

1. Classes, objects, and method calls (`Rectangle`)
2. Event loop with timers and click callbacks
3. Promise microtasks vs timeout macrotasks
4. Closures and lexical scope retention
5. Async/await with promise state transitions

## Guided Simulator Scope

This project intentionally uses a guided simulator (deterministic timeline builder) instead of a full JavaScript engine. It works best when examples follow the included lesson structures.

That tradeoff keeps explanations clear and step order stable for learning.

## Folder Guide

- `src/lessons/catalog.ts` - lesson metadata + starter code
- `src/simulator/builders.ts` - timeline generation logic
- `src/state/useSimulatorStore.ts` - app runtime state
- `src/components/` - editor, controls, timeline, and visual panels

## Product Roadmap

See `plan.md` for the phase-by-phase build roadmap and backlog.
