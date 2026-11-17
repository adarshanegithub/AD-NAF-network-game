import { test, eq, ok } from './runner.js';
import { GUIDANCE } from './fixtures.js';
import { initialState, reduce, currentRound, levelSummary, sessionSummary, levelComplete } from '../engine/state.js';

const load = async () => (await fetch(new URL('../data/levels.json', import.meta.url))).json();
const play = (content, state, ...actions) => actions.reduce((s, a) => reduce(s, a, content), state);
const WINNERS = { '1.1': 'B', '1.2': 'B', '2.1': 'A', '2.2': 'A', '3.1': 'B', '3.2': 'A' };

// Content trimmed to Level 2 / Round 2.1 for the US1 round tests.
async function round21() {
  const doc = await load();
  const level2 = { ...doc.levels[1], rounds: [doc.levels[1].rounds[0]] };
  return { ...doc, levels: [level2] };
}

test('state fresh session starts at the briefing (AC1)', async () => {
  const c = await load();
  const s = initialState(c);
  eq([s.view, s.levelIndex, s.roundIndex], ['briefing', 0, 0]);
  eq(reduce(s, { type: 'submit' }, c), s, 'cannot answer from the briefing');
});

test('state empty submit shows guidance and counts no attempt (AC4)', async () => {
  const c = await round21();
  const s = play(c, initialState(c), { type: 'start' }, { type: 'submit' });
  eq(s.feedback.kind, 'guidance');
  eq(s.feedback.message, GUIDANCE);
  eq(s.rounds['2.1'].attempts, 0);
  eq(s.rounds['2.1'].solved, false);
});

test('state wrong submit counts one attempt and stays open (AC3)', async () => {
  const c = await round21();
  const s = play(c, initialState(c), { type: 'start' }, { type: 'select', pathId: 'B' }, { type: 'submit' });
  eq(s.feedback.kind, 'incorrect');
  eq(s.feedback.misconception, 'A shorter AS-path beats a higher local preference');
  eq([s.rounds['2.1'].attempts, s.rounds['2.1'].solved], [1, false]);
  eq(reduce(s, { type: 'next' }, c), s, 'Next unavailable while unsolved');
});

test('state correct submit solves once; repeated submit has no effect (AC2, AC6)', async () => {
  const c = await round21();
  let s = play(c, initialState(c), { type: 'start' }, { type: 'select', pathId: 'B' }, { type: 'submit' },
    { type: 'select', pathId: 'A' }, { type: 'submit' });
  eq([s.rounds['2.1'].attempts, s.rounds['2.1'].solved, s.feedback.kind], [2, true, 'correct']);
  const again = play(c, s, { type: 'submit' }, { type: 'select', pathId: 'B' }, { type: 'submit' });
  eq(again.rounds['2.1'], s.rounds['2.1'], 'no change after success');
});

test('state help levels advance in order, are recorded, and never solve (AC5-AC5c)', async () => {
  const c = await load();
  let s = play(c, initialState(c), { type: 'start' });
  const id = currentRound(s, c).id;
  for (let i = 1; i <= 3; i++) {
    s = reduce(s, { type: 'help' }, c);
    eq(s.rounds[id].helpLevel, i, `help level ${i}`);
    eq([s.rounds[id].attempts, s.rounds[id].solved], [0, false], 'no attempt, not solved');
  }
  eq(reduce(s, { type: 'help' }, c).rounds[id].helpLevel, 3, 'capped at worked solution');
});

test('state full playthrough: level summaries then session summary (AC7)', async () => {
  const c = await load();
  let s = initialState(c);
  const views = [];
  for (let l = 0; l < 3; l++) {
    s = reduce(s, { type: 'start' }, c);
    for (let r = 0; r < 2; r++) {
      const id = currentRound(s, c).id;
      s = play(c, s, { type: 'select', pathId: WINNERS[id] }, { type: 'submit' });
      ok(s.rounds[id].solved, `${id} solved`);
      s = reduce(s, { type: 'next' }, c);
    }
    views.push(s.view);
    ok(levelComplete(s, c, l), `level ${l + 1} complete`);
    eq(levelSummary(s, c, l), { rounds: 2, completed: 2, attempts: 2, helpViews: 0, roundsWithHelp: 0 });
    s = reduce(s, { type: 'next' }, c);
    views.push(s.view);
  }
  eq(views, ['level-summary', 'briefing', 'level-summary', 'briefing', 'level-summary', 'session-summary']);
  eq(sessionSummary(s, c), { rounds: 6, completed: 6, attempts: 6, helpViews: 0, roundsWithHelp: 0 });
});

test('state summary keeps attempts and help separate from completion', async () => {
  const c = await load();
  const s = play(c, initialState(c), { type: 'start' }, { type: 'help' }, { type: 'help' },
    { type: 'select', pathId: 'A' }, { type: 'submit' }, { type: 'select', pathId: 'B' }, { type: 'submit' });
  eq(levelSummary(s, c), { rounds: 2, completed: 1, attempts: 2, helpViews: 2, roundsWithHelp: 1 });
});

test('state restart resets to the first briefing (AC8)', async () => {
  const c = await load();
  const s = play(c, initialState(c), { type: 'start' }, { type: 'select', pathId: 'A' }, { type: 'submit' });
  const r = reduce(s, { type: 'restart' }, c);
  eq(r, initialState(c));
});
