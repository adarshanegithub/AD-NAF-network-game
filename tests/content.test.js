import { test, eq, ok } from './runner.js';
import { ROUNDS, EXAMPLES, LABELS, METHOD } from './fixtures.js';
import { validateContent } from '../engine/content.js';

const load = async () => (await fetch(new URL('../data/levels.json', import.meta.url))).json();
const clone = (o) => JSON.parse(JSON.stringify(o));
const allRounds = (doc) => doc.levels.flatMap((l) => l.rounds);
const roundOf = (doc, id) => allRounds(doc).find((r) => r.id === id);

test('content levels.json is valid', async () => {
  const res = validateContent(await load());
  eq(res.errors, [], 'errors');
  ok(res.ok, 'ok');
});

test('content structure: 3 levels x 2 rounds in play order', async () => {
  const doc = await load();
  eq(doc.levels.map((l) => l.id), ['1', '2', '3']);
  eq(allRounds(doc).map((r) => r.id), ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2']);
  eq(doc.method, METHOD, 'method');
  eq(Object.fromEntries(Object.entries(doc.misconceptions).map(([k, v]) => [k, v.label])), LABELS, 'catalog labels');
});

for (const [id, f] of Object.entries(ROUNDS)) {
  test(`content ${id} matches its fixture`, async () => {
    const r = roundOf(await load(), id);
    ok(r, 'round present');
    eq(r.candidates, f.candidates, 'candidates');
    eq(r.expectedWinner, f.survivor, 'expectedWinner');
    eq(r.difficulty, f.difficulty, 'difficulty');
    eq(r.wrongChoices, f.wrong, 'wrongChoices (reasonCode + exact explanation)');
    ok(r.sourceIds.includes('cisco-13753'), 'cites Cisco 13753');
  });
}

for (const [lid, f] of Object.entries(EXAMPLES)) {
  test(`content briefing example L${lid} matches its fixture`, async () => {
    const doc = await load();
    const ex = doc.levels.find((l) => l.id === lid).briefing.example;
    eq(ex.candidates, f.candidates, 'candidates');
    eq(ex.winner, f.survivor, 'winner');
    eq(ex.explanation, f.explanation, 'explanation');
  });
}

test('content Level 1 briefing carries the modeled-steps wording', async () => {
  const doc = await load();
  ok(doc.levels[0].briefing.concept.startsWith("This router follows Cisco's default rules. We model the first five steps only. A real router has more tie-breaks after MED, but every round in this game is settled by one of the five steps shown, so you never need the ones we don't cover."));
});

// Each broken copy must be rejected and the error must name the round (or level).
const broken = [
  ['weight out of range', '2.1', (r) => { r.candidates[0].weight = 70000; }],
  ['missing MED', '2.1', (r) => { delete r.candidates[1].med; }],
  ['duplicate path id', '2.1', (r) => { r.candidates[1].id = 'A'; }],
  ['duplicate peer', '2.1', (r) => { r.candidates[1].peer = r.candidates[0].peer; }],
  ['ASN outside documentation range', '2.1', (r) => { r.candidates[0].asPath[1] = 64520; }],
  ['bad origin', '2.1', (r) => { r.candidates[0].origin = 'x'; }],
  ['wrong prefix', '2.1', (r) => { r.prefix = '10.0.0.0/8'; }],
  ['expectedWinner disagrees with the rule', '2.1', (r) => { r.expectedWinner = 'B'; }],
  ['reasonCode does not fit elimination step', '2.1', (r) => { r.wrongChoices.B.reasonCode = 'higher-med-is-better'; }],
  ['explanation cites a number not in the round', '2.1', (r) => { r.wrongChoices.B.explanation += ' A has 175.'; }],
  ['missing wrong choice', '2.2', (r) => { delete r.wrongChoices.C; }],
  ['wrong choices list the winner', '2.2', (r) => { r.wrongChoices.A = { reasonCode: 'lower-is-better', explanation: 'x' }; }],
  ['unknown reasonCode', '1.1', (r) => { r.wrongChoices.A.reasonCode = 'made-up'; }],
  ['lowest-med on a path without the lowest MED', '3.1', (r) => { r.wrongChoices.A.reasonCode = 'lowest-med-always-wins'; }],
  ['mixed neighboring ASes at MED', '3.1', (r) => { r.candidates[2].asPath = [64501, 64510]; }],
  ['tied after MED', '1.2', (r) => { r.candidates[1].med = 50; }],
  ['difficulty out of range', '1.1', (r) => { r.difficulty = 4; }],
  ['no Cisco 13753 source', '1.1', (r) => { r.sourceIds = ['rfc4271-9.1.2.2']; }],
  ['unknown source', '1.1', (r) => { r.sourceIds = ['cisco-13753', 'nope']; }],
];

for (const [name, rid, mutate] of broken) {
  test(`content rejects: ${name}`, async () => {
    const doc = clone(await load());
    mutate(roundOf(doc, rid));
    const res = validateContent(doc);
    ok(!res.ok, 'must be rejected');
    ok(res.errors.some((e) => e.roundId === rid), `an error names round ${rid}: ${JSON.stringify(res.errors)}`);
  });
}

test('content rejects: mixed-AS change from quickstart step 8 names med-mixed-neighbor-as', async () => {
  const doc = clone(await load());
  roundOf(doc, '3.1').candidates[2].asPath = [64501, 64510];
  const res = validateContent(doc);
  ok(res.errors.some((e) => e.roundId === '3.1' && e.problem === 'med-mixed-neighbor-as'), JSON.stringify(res.errors));
});

const brokenDoc = [
  ['not exactly 3 levels', (d) => { d.levels.pop(); }],
  ['not exactly 2 rounds', (d) => { d.levels[0].rounds.pop(); }],
  ['duplicate round id', (d) => { d.levels[1].rounds[0].id = '1.1'; }],
  ['difficulty lower than previous round', (d) => { d.levels[2].rounds[1].difficulty = 1; }],
  ['schemaVersion', (d) => { d.schemaVersion = 2; }],
  ['empty method', (d) => { d.method = ''; }],
  ['empty source claim', (d) => { d.sources[0].claim = ''; }],
  ['empty level title', (d) => { d.levels[0].title = ''; }],
  ['briefing example winner disagrees', (d) => { d.levels[2].briefing.example.winner = 'Z'; }],
  ['briefing example id outside P-Z', (d) => { d.levels[0].briefing.example.candidates[0].id = 'A'; }],
  ['briefing example reuses a round neighboring AS', (d) => { d.levels[0].briefing.example.candidates[0].asPath = [64500, 64510]; }],
  ['briefing without Cisco source', (d) => { d.levels[1].briefing.sourceIds = ['rfc5398']; }],
];

for (const [name, mutate] of brokenDoc) {
  test(`content rejects document: ${name}`, async () => {
    const doc = clone(await load());
    mutate(doc);
    ok(!validateContent(doc).ok, 'must be rejected');
  });
}

test('content rejects non-object', () => {
  ok(!validateContent(null).ok);
  ok(!validateContent({}).ok);
});
