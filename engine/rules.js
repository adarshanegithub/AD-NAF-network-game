// Pure BGP best-path rules (Cisco IOS defaults, first five steps only).
// No DOM, timers, network, randomness, or progress changes.
// Contract: specs/001-first-playable/contracts/rules-api.md

export const ORIGIN_CODE = { i: 0, e: 1, '?': 2 };

export const STEPS = [
  { step: 'weight', name: 'weight', higherWins: true, value: (p) => p.weight },
  { step: 'localPref', name: 'local preference', higherWins: true, value: (p) => p.localPref },
  { step: 'asPathLength', name: 'AS-path', higherWins: false, value: (p) => p.asPath.length },
  { step: 'origin', name: 'origin', higherWins: false, value: (p) => p.origin, rank: (v) => ORIGIN_CODE[v] },
  { step: 'med', name: 'MED', higherWins: false, value: (p) => p.med },
];

const rankOf = (def, v) => (def.rank ? def.rank(v) : v);

export function neighborAs(path) {
  return path.asPath[0];
}

function bestValue(def, paths) {
  let best = def.value(paths[0]);
  for (const p of paths.slice(1)) {
    const v = def.value(p);
    const better = def.higherWins ? rankOf(def, v) > rankOf(def, best) : rankOf(def, v) < rankOf(def, best);
    if (better) best = v;
  }
  return best;
}

function notReached(def) {
  return { step: def.step, status: 'not-reached', values: {}, best: null, eliminated: [], neighborAs: null };
}

export function selectBestPath(candidates) {
  let remaining = [...candidates];
  const ladder = [];
  for (const def of STEPS) {
    if (remaining.length === 1) {
      ladder.push(notReached(def));
      continue;
    }
    if (def.step === 'med') {
      const asns = new Set(remaining.map(neighborAs));
      if (asns.size > 1) {
        ladder.push(notReached(def));
        return { status: 'content-error', survivor: null, reasonCode: 'med-mixed-neighbor-as', ladder };
      }
    }
    const values = {};
    for (const p of remaining) values[p.id] = def.value(p);
    const best = bestValue(def, remaining);
    const keep = remaining.filter((p) => rankOf(def, def.value(p)) === rankOf(def, best));
    const eliminated = remaining.filter((p) => !keep.includes(p)).map((p) => p.id);
    const status = eliminated.length === 0 ? 'tie' : keep.length === 1 ? 'decides' : 'narrows';
    const entry = { step: def.step, status, values, best, eliminated, neighborAs: null };
    if (def.step === 'med') {
      entry.neighborAs = Object.fromEntries(remaining.map((p) => [p.id, neighborAs(p)]));
    }
    ladder.push(entry);
    remaining = keep;
  }
  if (remaining.length > 1) {
    return { status: 'content-error', survivor: null, reasonCode: 'tied-after-med', ladder };
  }
  return { status: 'ok', survivor: remaining[0].id, reasonCode: null, ladder };
}

export function compareHeadToHead(a, b) {
  for (const def of STEPS) {
    if (def.step === 'med' && neighborAs(a) !== neighborAs(b)) break;
    const va = rankOf(def, def.value(a));
    const vb = rankOf(def, def.value(b));
    if (va !== vb) {
      const aWins = def.higherWins ? va > vb : va < vb;
      return { winner: aWins ? a.id : b.id, decidedAt: def.step };
    }
  }
  return { winner: null, decidedAt: null };
}

export function checkHeadToHead(candidates, survivorId) {
  const survivor = candidates.find((p) => p.id === survivorId);
  if (!survivor) return { ok: false, failures: candidates.map((p) => p.id) };
  const failures = candidates
    .filter((p) => p.id !== survivorId)
    .filter((p) => compareHeadToHead(survivor, p).winner !== survivorId)
    .map((p) => p.id);
  return { ok: failures.length === 0, failures };
}

export function evaluate(round, answer) {
  const pathId = answer && answer.pathId;
  if (!pathId || !round.candidates.some((p) => p.id === pathId)) {
    return { status: 'invalid-input', chosen: pathId || null, expected: null, reasonCode: null, evidence: null };
  }
  const result = selectBestPath(round.candidates);
  if (result.status !== 'ok') {
    return { status: 'content-error', chosen: pathId, expected: null, reasonCode: result.reasonCode, evidence: result };
  }
  if (pathId === result.survivor) {
    return { status: 'correct', chosen: pathId, expected: result.survivor, reasonCode: null, evidence: result };
  }
  const wrong = round.wrongChoices && round.wrongChoices[pathId];
  return {
    status: 'incorrect',
    chosen: pathId,
    expected: result.survivor,
    reasonCode: wrong ? wrong.reasonCode : null,
    evidence: result,
  };
}

// Step at which a given path was eliminated in a ladder, or null.
export function eliminatedAt(ladder, pathId) {
  const entry = ladder.find((e) => e.eliminated.includes(pathId));
  return entry ? entry.step : null;
}
