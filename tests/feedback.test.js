import { test, eq, ok } from './runner.js';
import { ROUNDS, LABELS, NEXT_STEP, GUIDANCE, METHOD } from './fixtures.js';
import { evaluate, selectBestPath } from '../engine/rules.js';
import { explain, workedStep, GUIDANCE as G, NEXT_STEP as N } from '../engine/feedback.js';

const content = { misconceptions: Object.fromEntries(Object.entries(LABELS).map(([k, label]) => [k, { label }])) };

test('feedback fixed strings', () => {
  eq(G, GUIDANCE, 'guidance');
  eq(N, NEXT_STEP, 'next step');
});

for (const [id, f] of Object.entries(ROUNDS)) {
  const round = { candidates: f.candidates, wrongChoices: f.wrong };

  for (const [pid, w] of Object.entries(f.wrong)) {
    test(`feedback ${id} wrong ${pid} exact text`, () => {
      const fb = explain(round, evaluate(round, { pathId: pid }), content);
      eq(fb.kind, 'incorrect', 'kind');
      eq(fb.misconception, LABELS[w.reasonCode], 'misconception label');
      eq(fb.explanation, w.explanation, 'explanation');
      eq(fb.nextStep, NEXT_STEP, 'next step');
      eq(fb.message, `Not this one. Misconception: ${LABELS[w.reasonCode]}. ${w.explanation} ${NEXT_STEP}`, 'message');
    });
  }

  test(`feedback ${id} correct exact text`, () => {
    const fb = explain(round, evaluate(round, { pathId: f.survivor }), content);
    eq(fb.kind, 'correct', 'kind');
    eq(fb.message, f.correct, 'message');
  });

  test(`feedback ${id} worked step exact text`, () => {
    eq(workedStep(selectBestPath(f.candidates)), f.workedStep);
  });

  test(`feedback ${id} guidance on empty submit`, () => {
    const fb = explain(round, evaluate(round, { pathId: null }), content);
    eq([fb.kind, fb.message], ['guidance', GUIDANCE]);
  });
}

test('feedback 2.1 correct text matches the spec worked interaction', () => {
  eq(ROUNDS['2.1'].correct, 'Correct. Path A wins on local preference (150 > 100). Weight tied at 0. AS-path, origin, and MED were not reached.');
});

test('feedback method hint text is exact and reveals no round values', async () => {
  const doc = await (await fetch(new URL('../data/levels.json', import.meta.url))).json();
  eq(doc.method, METHOD, 'method text');
  ok(!/\d/.test(doc.method), 'method contains no numbers (no round values)');
  ok(!/Path [A-D]\b/.test(doc.method), 'method names no path');
});
