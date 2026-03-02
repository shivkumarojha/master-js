# Master JS Visual Lab - Build Plan

## Phase 1 - Core Simulator MVP

- [x] Set up Vite + React + TypeScript project
- [x] Add guided simulation engine with deterministic snapshots
- [x] Build visual lanes for call stack, Web APIs, callback queue, microtask queue
- [x] Add memory + console panels
- [x] Add playback controls (run, pause, step, reset, speed)
- [x] Add timeline scrubber and step cards
- [x] Add starter lessons:
  - [x] Rectangle class/object flow
  - [x] Event loop timers + click callback
  - [x] Promise microtasks vs timeout macrotasks

## Phase 2 - Better Teaching UX

- [ ] Guided narration mode (auto-explains each frame)
- [ ] "Why this happened" side notes per step
- [ ] Novice/Advanced view toggle
- [ ] Better code focus highlighting with token-level emphasis
- [ ] Playback bookmarks on key transitions

## Phase 3 - More JavaScript Concepts

- [ ] Closures and lexical environment visualization
- [ ] `this` binding across call-site styles
- [ ] Prototypes and prototype chain lookup
- [ ] Hoisting (`var`, function declarations, TDZ for `let`/`const`)
- [ ] `async/await` as promise + microtask steps

## Phase 4 - Authoring and Sharing

- [ ] Lesson author mode (build step timeline from templates)
- [ ] Save/load custom lessons
- [ ] Shareable lesson links
- [ ] Embeddable read-only viewer

## Phase 5 - Quality and Scale

- [ ] Unit tests for all timeline builders
- [ ] Visual regression snapshots for core views
- [ ] Accessibility pass (keyboard flows + announcements)
- [ ] Mobile interaction polish for timeline and editor
- [ ] Analytics for lesson completion funnel

## Immediate Next Sprint

1. [x] Add closure lesson with lexical scope panel
2. [x] Add `async/await` lesson with promise state transitions
3. [x] Replace textarea with Monaco Editor
4. [x] Add tests for event loop ordering edge cases
