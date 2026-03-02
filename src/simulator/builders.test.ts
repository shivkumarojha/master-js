import { describe, expect, it } from 'vitest'
import { buildEventLoopTimeline } from './builders'

function eventLoopCode(outerDelay: number, innerDelay: number) {
  return `const button = document.querySelector('button');

button.addEventListener('click', function onClick() {
  setTimeout(function timer() {
    console.log('You clicked the button!');
  }, ${innerDelay});
});

console.log('Hi!');

setTimeout(function timeout() {
  console.log('Click the button!');
}, ${outerDelay});

console.log('Welcome to loop lab.');
`
}

function snapshotIndexByTitle(titles: string[], title: string) {
  return titles.findIndex((item) => item === title)
}

describe('buildEventLoopTimeline', () => {
  it('keeps sync logs before async callbacks', () => {
    const snapshots = buildEventLoopTimeline(eventLoopCode(5000, 2000))
    const finalLogs = snapshots.at(-1)?.consoleLines ?? []

    expect(finalLogs).toEqual([
      'Hi!',
      'Welcome to loop lab.',
      'You clicked the button!',
      'Click the button!',
    ])
  })

  it('runs outer timeout before click callback when delay is very short', () => {
    const snapshots = buildEventLoopTimeline(eventLoopCode(500, 2000))
    const titles = snapshots.map((snapshot) => snapshot.title)
    const finalLogs = snapshots.at(-1)?.consoleLines ?? []

    expect(finalLogs).toEqual([
      'Hi!',
      'Welcome to loop lab.',
      'Click the button!',
      'You clicked the button!',
    ])

    expect(snapshotIndexByTitle(titles, 'Outer timeout runs')).toBeLessThan(
      snapshotIndexByTitle(titles, 'User click occurs (simulated)'),
    )
  })

  it('runs outer timeout between click callback and inner timer when due in between', () => {
    const snapshots = buildEventLoopTimeline(eventLoopCode(1500, 2000))
    const titles = snapshots.map((snapshot) => snapshot.title)
    const finalLogs = snapshots.at(-1)?.consoleLines ?? []

    expect(finalLogs).toEqual([
      'Hi!',
      'Welcome to loop lab.',
      'Click the button!',
      'You clicked the button!',
    ])

    expect(snapshotIndexByTitle(titles, 'User click occurs (simulated)')).toBeLessThan(
      snapshotIndexByTitle(titles, 'Outer timeout runs'),
    )
    expect(snapshotIndexByTitle(titles, 'Outer timeout runs')).toBeLessThan(
      snapshotIndexByTitle(titles, 'Inner timer runs'),
    )
  })

  it('keeps timeline clock monotonic for edge-case timer combinations', () => {
    const snapshots = buildEventLoopTimeline(eventLoopCode(500, 2000))
    const clocks = snapshots.map((snapshot) => snapshot.clock)
    const sorted = [...clocks].sort((a, b) => a - b)

    expect(clocks).toEqual(sorted)
  })
})
