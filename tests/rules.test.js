import { test, eq, ok } from './runner.js';
import { ROUNDS, EXAMPLES, BOUNDARY, UNSUPPORTED } from './fixtures.js';
import { selectBestPath, compareHeadToHead, checkHeadToHead, evaluate } from '../engine/rules.js';

for (const [id, f] of Object.entries(ROUNDS)) {
  test(`rules ${id} survivor`, () => {
    const r = selectBestPath(f.candidates);
    eq(r.status, 'ok', 'status');
    eq(r.survivor, f.survivor, 'survivor');
  });

  test(`rules ${id} ladder`, () => {
    const r = selectBestPath(f.candidates);
    eq(r.ladder.length, 5, 'ladder length');
    f.ladder.forEach(([step, status, values, eliminated], i) => {
      eq(r.ladder[i].step, step, `step ${i + 1}`);
      eq(r.ladder[i].status, status, `${step} status`);
      eq(r.ladder[i].values, values, `${step} values`);
      eq(r.ladder[i].eliminated, eliminated, `${step} eliminated`);
    });
  });

  test(`rules ${id} head-to-head`, () => {
    const winner = f.candidates.find((c) => c.id === f.survivor);
    for (const [otherId, decidedAt] of Object.entries(f.headToHead)) {
      const other = f.candidates.find((c) => c.id === otherId);
      eq(compareHeadToHead(winner, other), { winner: f.survivor, decidedAt }, `${f.survivor} vs ${otherId}`);
    }
    eq(Object.keys(f.headToHead).length, f.candidates.length - 1, 'every other candidate covered');
    eq(checkHeadToHead(f.candidates, f.survivor), { ok: true, failures: [] }, 'checkHeadToHead');
  });

  test(`rules ${id} evaluate`, () => {
    const round = { candidates: f.candidates, wrongChoices: f.wrong };
    const c = evaluate(round, { pathId: f.survivor });
    eq([c.status, c.expected], ['correct', f.survivor], 'correct');
    for (const [pid, w] of Object.entries(f.wrong)) {
      const r = evaluate(round, { pathId: pid });
      eq([r.status, r.reasonCode], ['incorrect', w.reasonCode], `wrong ${pid}`);
    }
    eq(evaluate(round, {}).status, 'invalid-input', 'missing pathId');
    eq(evaluate(round, { pathId: 'Z' }).status, 'invalid-input', 'unknown pathId');
    eq(evaluate(round, null).status, 'invalid-input', 'null answer');
  });
}

for (const [level, f] of Object.entries(EXAMPLES)) {
  test(`rules briefing example L${level}`, () => {
    const r = selectBestPath(f.candidates);
    eq(r.survivor, f.survivor, 'survivor');
    eq(r.ladder.map((e) => e.status), f.statuses, 'statuses');
    const w = f.candidates.find((c) => c.id === f.survivor);
    for (const [otherId, decidedAt] of Object.entries(f.headToHead)) {
      eq(compareHeadToHead(w, f.candidates.find((c) => c.id === otherId)), { winner: f.survivor, decidedAt }, otherId);
    }
  });
}

for (const [name, f] of Object.entries(BOUNDARY)) {
  test(`rules boundary ${name}`, () => {
    const r = selectBestPath(f.candidates);
    eq(r.survivor, f.survivor, 'survivor');
    eq(r.ladder.map((e) => e.status), f.statuses, 'statuses');
  });
}

test('rules boundary equal-length AS-paths: ASN values never compared', () => {
  const r = selectBestPath(BOUNDARY['equal-length-as-paths'].candidates);
  eq(r.ladder[2].values, { A: 2, B: 2 }, 'only lengths compared');
});

for (const [name, f] of Object.entries(UNSUPPORTED)) {
  test(`rules unsupported ${name}`, () => {
    const r = selectBestPath(f.candidates);
    eq([r.status, r.survivor, r.reasonCode], ['content-error', null, f.reasonCode]);
    eq(evaluate({ candidates: f.candidates, wrongChoices: {} }, { pathId: 'A' }).status, 'content-error', 'evaluate');
  });
}

test('rules unsupported mixed-as: head-to-head check fails (B vs C undecided)', () => {
  const c = UNSUPPORTED['mixed-as-at-med'].candidates;
  eq(compareHeadToHead(c[1], c[2]), { winner: null, decidedAt: null });
  ok(!checkHeadToHead(c, 'B').ok, 'check must fail');
});

test('rules med neighborAs recorded at MED step', () => {
  const r = selectBestPath(ROUNDS['3.1'].candidates);
  eq(r.ladder[4].neighborAs, { A: 64500, B: 64500 });
});
