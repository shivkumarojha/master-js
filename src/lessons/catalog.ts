import {
  buildAsyncAwaitTimeline,
  buildClosureTimeline,
  buildEventLoopTimeline,
  buildPromiseTimeline,
  buildRectangleTimeline,
} from '../simulator/builders'
import type { LessonDefinition } from '../simulator/types'

const rectangleStarter = `class Rectangle {
  constructor(width, height, color) {
    this.width = width;
    this.height = height;
    this.color = color;
  }

  area() {
    const area = this.width * this.height;
    return area;
  }

  paint() {
    console.log(\`Painting with color \${this.color}\`);
  }
}

const rect = new Rectangle(2, 4, 'teal');
const area = rect.area();
console.log(area);
`

const eventLoopStarter = `const button = document.querySelector('button');

button.addEventListener('click', function onClick() {
  setTimeout(function timer() {
    console.log('You clicked the button!');
  }, 2000);
});

console.log('Hi!');

setTimeout(function timeout() {
  console.log('Click the button!');
}, 5000);

console.log('Welcome to loop lab.');
`

const promiseStarter = `console.log('script start');

setTimeout(() => console.log('timeout callback'), 0);

Promise.resolve()
  .then(() => console.log('promise then 1'))
  .then(() => console.log('promise then 2'));

console.log('script end');
`

const closureStarter = `function createCounter(start) {
  let count = start;

  return function increment() {
    count += 1;
    console.log(count);
  };
}

const counter = createCounter(2);
counter();
counter();
`

const asyncAwaitStarter = `async function runLesson() {
  console.log('inside async before await');
  const value = await Promise.resolve('resolved value');
  console.log(\`await resumed with \${value}\`);
}

console.log('script start');
runLesson();
setTimeout(() => console.log('timeout callback'), 0);
console.log('script end');
`

export const lessonCatalog: LessonDefinition[] = [
  {
    id: 'rectangle-basics',
    title: 'Classes, Objects, and Method Calls',
    summary:
      'Track how constructor calls, method invocations, and return values move through stack and memory.',
    concepts: ['class', 'new', 'call stack', 'memory', 'return value'],
    starterCode: rectangleStarter,
    buildTimeline: buildRectangleTimeline,
  },
  {
    id: 'event-loop-click',
    title: 'Event Loop with Timers and Click Events',
    summary:
      'Watch sync logs, Web API timers, callback queue, and a simulated click event in slow motion.',
    concepts: ['event loop', 'setTimeout', 'DOM event', 'callback queue'],
    starterCode: eventLoopStarter,
    buildTimeline: buildEventLoopTimeline,
  },
  {
    id: 'promises',
    title: 'Promise Microtasks vs Timeout Macrotasks',
    summary:
      'See why promise callbacks run before setTimeout callbacks, even when timeout is 0ms.',
    concepts: ['promise', 'microtask queue', 'macrotask queue'],
    starterCode: promiseStarter,
    buildTimeline: buildPromiseTimeline,
  },
  {
    id: 'closures',
    title: 'Closures and Lexical Scope Retention',
    summary:
      'Visualize how inner functions keep access to outer variables after the outer function returns.',
    concepts: ['closure', 'lexical scope', 'captured state'],
    starterCode: closureStarter,
    buildTimeline: buildClosureTimeline,
  },
  {
    id: 'async-await',
    title: 'Async/Await with Promise State Transitions',
    summary:
      'Track await suspension, microtask resumption, promise fulfillment, and timer ordering.',
    concepts: ['async/await', 'promise state', 'microtask', 'macrotask'],
    starterCode: asyncAwaitStarter,
    buildTimeline: buildAsyncAwaitTimeline,
  },
]

export const defaultLessonId = lessonCatalog[0].id
