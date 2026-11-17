// Hand-transcribed fixtures. Every expected value below was typed from
// specs/001-first-playable/spec.md (Round Content, Briefing worked examples,
// Wrong-choice Fixtures, Boundary and Unsupported Fixtures) and
// specs/001-first-playable/contracts/feedback-text.md. Nothing here is generated
// by calling the engine (constitution principle I).
// Source for every row: Cisco Document ID 13753, "How the Best Path Algorithm Works";
// RFC 4271 §4.3 for origin codes. Markdown code backticks in the spec are formatting
// and are not part of the displayed text.

const p = (id, peer, weight, localPref, asPath, origin, med) => ({ id, peer, weight, localPref, asPath, origin, med });

export const NEXT_STEP = 'Try again: start at weight and stop at the step that leaves one path.';
export const GUIDANCE = 'Pick a path before submitting.';
export const METHOD = "Check the steps in order: weight, local preference, AS-path, origin, MED. At each step, drop the paths that lose; the step that leaves one path decides.";

export const LABELS = {
  'lower-is-better': 'Lower is better for everything',
  'higher-med-is-better': 'Higher MED is better',
  'shorter-as-path-beats-local-pref': 'A shorter AS-path beats a higher local preference',
  'local-pref-beats-weight': 'Local preference beats weight',
  'scorecard-later-steps': 'Scorecard thinking: a shorter AS-path and better origin outweigh an earlier step',
  'lowest-med-always-wins': 'The lowest MED always wins',
};

const WS_TIE3 = "Step 1, weight: A has 0, B has 0, C has 0. Every remaining path has 0, so it's a tie. Continue with local preference.";
const WS_TIE2 = "Step 1, weight: A has 0, B has 0. Every remaining path has 0, so it's a tie. Continue with local preference.";

// ladder entries: [step, status, values (remaining paths; {} when not reached), eliminated]
export const ROUNDS = {
  '1.1': {
    difficulty: 1,
    candidates: [
      p('A', '192.0.2.1', 0, 100, [64500, 64510], 'i', 0),
      p('B', '192.0.2.5', 0, 200, [64501, 64510], 'i', 0),
      p('C', '192.0.2.9', 0, 100, [64502, 64510], 'i', 0),
    ],
    survivor: 'B',
    ladder: [
      ['weight', 'tie', { A: 0, B: 0, C: 0 }, []],
      ['localPref', 'decides', { A: 100, B: 200, C: 100 }, ['A', 'C']],
      ['asPathLength', 'not-reached', {}, []],
      ['origin', 'not-reached', {}, []],
      ['med', 'not-reached', {}, []],
    ],
    headToHead: { A: 'localPref', C: 'localPref' },
    wrong: {
      A: { reasonCode: 'lower-is-better', explanation: 'Local preference: higher wins. B has 200, A has 100.' },
      C: { reasonCode: 'lower-is-better', explanation: 'Local preference: higher wins. B has 200, C has 100. C and A tie on every modeled step; the neighboring AS number (64502) is never compared as a value.' },
    },
    correct: 'Correct. Path B wins on local preference (200 > 100). Weight tied at 0. AS-path, origin, and MED were not reached.',
    workedStep: WS_TIE3,
  },
  '1.2': {
    difficulty: 1,
    candidates: [
      p('A', '192.0.2.1', 0, 100, [64500, 64510], 'i', 50),
      p('B', '192.0.2.5', 0, 100, [64500, 64510], 'i', 20),
    ],
    survivor: 'B',
    ladder: [
      ['weight', 'tie', { A: 0, B: 0 }, []],
      ['localPref', 'tie', { A: 100, B: 100 }, []],
      ['asPathLength', 'tie', { A: 2, B: 2 }, []],
      ['origin', 'tie', { A: 'i', B: 'i' }, []],
      ['med', 'decides', { A: 50, B: 20 }, ['A']],
    ],
    headToHead: { A: 'med' },
    wrong: {
      A: { reasonCode: 'higher-med-is-better', explanation: 'MED: lower wins, and both paths come from AS 64500, so MED is compared. B has 20, A has 50.' },
    },
    correct: 'Correct. Path B wins on MED (20 < 50, both from AS 64500). Weight tied at 0. Local preference tied at 100. AS-path length tied at 2. Origin tied at i.',
    workedStep: WS_TIE2,
  },
  '2.1': {
    difficulty: 2,
    candidates: [
      p('A', '192.0.2.1', 0, 150, [64500, 64498, 64499, 64510], 'i', 0),
      p('B', '192.0.2.5', 0, 100, [64501, 64510], 'i', 0),
    ],
    survivor: 'A',
    ladder: [
      ['weight', 'tie', { A: 0, B: 0 }, []],
      ['localPref', 'decides', { A: 150, B: 100 }, ['B']],
      ['asPathLength', 'not-reached', {}, []],
      ['origin', 'not-reached', {}, []],
      ['med', 'not-reached', {}, []],
    ],
    headToHead: { B: 'localPref' },
    wrong: {
      B: { reasonCode: 'shorter-as-path-beats-local-pref', explanation: "Path B has the shorter AS-path, but AS-path is step 3. Step 1, weight: both are 0, so it's a tie. Step 2, local preference: A has 150 and B has 100. Higher wins, so A is chosen before AS-path is checked." },
    },
    correct: 'Correct. Path A wins on local preference (150 > 100). Weight tied at 0. AS-path, origin, and MED were not reached.',
    workedStep: WS_TIE2,
  },
  '2.2': {
    difficulty: 2,
    candidates: [
      p('A', '192.0.2.1', 100, 100, [64500, 64498, 64510], '?', 0),
      p('B', '192.0.2.5', 0, 200, [64501, 64510], 'i', 0),
      p('C', '192.0.2.9', 0, 100, [64502, 64510], 'i', 0),
    ],
    survivor: 'A',
    ladder: [
      ['weight', 'decides', { A: 100, B: 0, C: 0 }, ['B', 'C']],
      ['localPref', 'not-reached', {}, []],
      ['asPathLength', 'not-reached', {}, []],
      ['origin', 'not-reached', {}, []],
      ['med', 'not-reached', {}, []],
    ],
    headToHead: { B: 'weight', C: 'weight' },
    wrong: {
      B: { reasonCode: 'local-pref-beats-weight', explanation: 'B has the highest local preference, but weight is checked first. A has weight 100, B has 0.' },
      C: { reasonCode: 'scorecard-later-steps', explanation: 'C has a shorter AS-path than A (2 vs 3) and a better origin (i vs ?), but weight is step 1 and decides first: A has 100, B and C have 0. C is out at weight, so its AS-path and origin are never compared.' },
    },
    correct: 'Correct. Path A wins on weight (100 > 0). Local preference, AS-path, origin, and MED were not reached.',
    workedStep: 'Step 1, weight: A has 100, B has 0, C has 0. Higher wins, so only A remains: weight decides.',
  },
  '3.1': {
    difficulty: 3,
    candidates: [
      p('A', '192.0.2.1', 0, 100, [64500, 64510], 'i', 50),
      p('B', '192.0.2.5', 0, 100, [64500, 64510], 'i', 20),
      p('C', '192.0.2.9', 0, 100, [64501, 64498, 64510], 'i', 5),
    ],
    survivor: 'B',
    ladder: [
      ['weight', 'tie', { A: 0, B: 0, C: 0 }, []],
      ['localPref', 'tie', { A: 100, B: 100, C: 100 }, []],
      ['asPathLength', 'narrows', { A: 2, B: 2, C: 3 }, ['C']],
      ['origin', 'tie', { A: 'i', B: 'i' }, []],
      ['med', 'decides', { A: 50, B: 20 }, ['A']],
    ],
    headToHead: { A: 'med', C: 'asPathLength' },
    wrong: {
      A: { reasonCode: 'higher-med-is-better', explanation: 'A and B both come from AS 64500, so MED is compared. Lower wins: B has 20, A has 50.' },
      C: { reasonCode: 'lowest-med-always-wins', explanation: "C has the lowest MED (5), but AS-path is step 3 and C's is longer (3 vs 2), so C is out before MED is checked. C also comes from AS 64501, so its MED would never be compared with A's or B's from AS 64500." },
    },
    correct: 'Correct. Path B wins on MED (20 < 50, both from AS 64500). Weight tied at 0. Local preference tied at 100. AS-path removed C (3 > 2). Origin tied at i.',
    workedStep: WS_TIE3,
  },
  '3.2': {
    difficulty: 3,
    candidates: [
      p('A', '192.0.2.13', 0, 100, [64502, 64510], 'i', 40),
      p('B', '192.0.2.17', 0, 100, [64502, 64510], 'i', 80),
      p('C', '192.0.2.19', 0, 100, [64503, 64510], '?', 0),
    ],
    survivor: 'A',
    ladder: [
      ['weight', 'tie', { A: 0, B: 0, C: 0 }, []],
      ['localPref', 'tie', { A: 100, B: 100, C: 100 }, []],
      ['asPathLength', 'tie', { A: 2, B: 2, C: 2 }, []],
      ['origin', 'narrows', { A: 'i', B: 'i', C: '?' }, ['C']],
      ['med', 'decides', { A: 40, B: 80 }, ['B']],
    ],
    headToHead: { B: 'med', C: 'origin' },
    wrong: {
      B: { reasonCode: 'higher-med-is-better', explanation: 'A and B both come from AS 64502 and survive origin, so MED is compared. Lower wins: A has 40, B has 80.' },
      C: { reasonCode: 'lowest-med-always-wins', explanation: 'C has the lowest MED (0), but origin is checked first: C is ? (2), A and B are i (0). C is out before MED. C also comes from AS 64503, so its MED is never compared with paths from AS 64502.' },
    },
    correct: 'Correct. Path A wins on MED (40 < 80, both from AS 64502). Weight tied at 0. Local preference tied at 100. AS-path length tied at 2. Origin removed C (? = 2 > i = 0).',
    workedStep: WS_TIE3,
  },
};

export const EXAMPLES = {
  '1': {
    candidates: [
      p('P', '192.0.2.33', 0, 100, [64506, 64510], 'i', 0),
      p('Q', '192.0.2.37', 0, 100, [64507, 64510], 'e', 0),
    ],
    survivor: 'P',
    statuses: ['tie', 'tie', 'tie', 'decides', 'not-reached'],
    headToHead: { Q: 'origin' },
    explanation: 'Weight (0), local preference (100), and AS-path length (2) tie. Origin decides: lower wins, and P is i (0) while Q is e (1), so P wins. MED is not reached.',
  },
  '2': {
    candidates: [
      p('R', '192.0.2.41', 0, 100, [64508, 64497, 64510], 'i', 0),
      p('S', '192.0.2.45', 0, 100, [64509, 64510], '?', 0),
    ],
    survivor: 'S',
    statuses: ['tie', 'tie', 'decides', 'not-reached', 'not-reached'],
    headToHead: { R: 'asPathLength' },
    explanation: "R has the better origin (i vs ?), but AS-path is step 3 and origin is step 4. Weight (0) and local preference (100) tie; S's AS-path is shorter (2 vs 3), so S wins before origin is checked.",
  },
  '3': {
    candidates: [
      p('X', '192.0.2.21', 0, 100, [64504, 64510], 'i', 60),
      p('Y', '192.0.2.25', 0, 100, [64504, 64510], 'i', 25),
      p('Z', '192.0.2.29', 0, 90, [64505, 64510], 'i', 10),
    ],
    survivor: 'Y',
    statuses: ['tie', 'narrows', 'tie', 'tie', 'decides'],
    headToHead: { X: 'med', Z: 'localPref' },
    explanation: "Z has the lowest MED but is out at local preference (90 < 100). X and Y both come from neighbor AS 64504, so MED is compared and Y wins (25 < 60). Z's MED is never compared with X's or Y's, because it comes from a different neighboring AS.",
  },
};

export const BOUNDARY = {
  'equal-length-as-paths': {
    candidates: [
      p('A', '192.0.2.1', 0, 100, [64500, 64510], 'i', 0),
      p('B', '192.0.2.5', 0, 100, [64501, 64498], 'e', 0),
    ],
    survivor: 'A',
    statuses: ['tie', 'tie', 'tie', 'decides', 'not-reached'],
  },
  'med-zero': {
    candidates: [
      p('A', '192.0.2.1', 0, 100, [64500, 64510], 'i', 0),
      p('B', '192.0.2.5', 0, 100, [64500, 64510], 'i', 1),
    ],
    survivor: 'A',
    statuses: ['tie', 'tie', 'tie', 'tie', 'decides'],
  },
};

export const UNSUPPORTED = {
  'mixed-as-at-med': {
    candidates: [
      p('A', '192.0.2.1', 0, 100, [64500, 64510], 'i', 50),
      p('B', '192.0.2.5', 0, 100, [64500, 64510], 'i', 20),
      p('C', '192.0.2.9', 0, 100, [64501, 64510], 'i', 5),
    ],
    reasonCode: 'med-mixed-neighbor-as',
  },
  'equal-same-as-med': {
    candidates: [
      p('A', '192.0.2.1', 0, 100, [64500, 64510], 'i', 30),
      p('B', '192.0.2.5', 0, 100, [64500, 64510], 'i', 30),
    ],
    reasonCode: 'tied-after-med',
  },
};
