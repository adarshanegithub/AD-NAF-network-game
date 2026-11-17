// Feedback text. Contract: specs/001-first-playable/contracts/feedback-text.md
import { STEPS, ORIGIN_CODE } from './rules.js';

export const GUIDANCE = 'Pick a path before submitting.';
export const NEXT_STEP = 'Try again: start at weight and stop at the step that leaves one path.';

export const STATUS_WORD = { tie: 'tie', narrows: 'narrows', decides: 'decides', 'not-reached': 'not reached' };

const defOf = (step) => STEPS.find((d) => d.step === step);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function joinList(items) {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

// Value as shown when two values are compared.
function cmpValue(step, v) {
  return step === 'origin' ? `${v} = ${ORIGIN_CODE[v]}` : String(v);
}

function bestOf(def, values) {
  const rank = (v) => (def.rank ? def.rank(v) : v);
  return values.reduce((a, b) => {
    const better = def.higherWins ? rank(b) > rank(a) : rank(b) < rank(a);
    return better ? b : a;
  });
}

function loserBest(entry) {
  const def = defOf(entry.step);
  return bestOf(def, entry.eliminated.map((id) => entry.values[id]));
}

function tieSentence(entry) {
  const label = entry.step === 'asPathLength' ? 'AS-path length' : cap(defOf(entry.step).name);
  return `${label} tied at ${entry.best}.`;
}

function narrowsSentence(entry) {
  const def = defOf(entry.step);
  const op = def.higherWins ? '<' : '>';
  return `${cap(def.name)} removed ${joinList(entry.eliminated)} (${cmpValue(entry.step, loserBest(entry))} ${op} ${cmpValue(entry.step, entry.best)}).`;
}

export function correctMessage(result) {
  const ladder = result.ladder;
  const di = ladder.findIndex((e) => e.status === 'decides');
  const d = ladder[di];
  const def = defOf(d.step);
  const op = def.higherWins ? '>' : '<';
  let detail = `${cmpValue(d.step, d.best)} ${op} ${cmpValue(d.step, loserBest(d))}`;
  if (d.step === 'med') detail += `, both from AS ${d.neighborAs[result.survivor]}`;
  const parts = [`Correct. Path ${result.survivor} wins on ${def.name} (${detail}).`];
  for (const e of ladder.slice(0, di)) {
    parts.push(e.status === 'tie' ? tieSentence(e) : narrowsSentence(e));
  }
  const rest = ladder.slice(di + 1).map((e) => defOf(e.step).name);
  if (rest.length) {
    const list = joinList(rest);
    parts.push(`${cap(list)} ${rest.length === 1 ? 'was' : 'were'} not reached.`);
  }
  return parts.join(' ');
}

export function workedStep(result) {
  const e = result.ladder[0];
  const ids = Object.keys(e.values);
  const list = ids.map((id) => `${id} has ${e.values[id]}`).join(', ');
  const head = `Step 1, weight: ${list}.`;
  if (e.status === 'tie') return `${head} Every remaining path has ${e.best}, so it's a tie. Continue with local preference.`;
  if (e.status === 'decides') {
    const w = ids.find((id) => !e.eliminated.includes(id));
    return `${head} Higher wins, so only ${w} remains: weight decides.`;
  }
  if (e.status === 'narrows') return `${head} Higher wins, so ${joinList(e.eliminated)} drop out. Continue with local preference.`;
  // Step 1 not reached cannot happen with two or more candidates.
  return head;
}

// Rows for the worked solution and the post-answer ladder.
export function ladderRows(result) {
  return result.ladder.map((e, i) => {
    const def = defOf(e.step);
    let detail = '';
    if (e.status !== 'not-reached') {
      const vals = Object.entries(e.values).map(([id, v]) => `${id} ${v}`).join(', ');
      detail = `${vals}. ${def.higherWins ? 'Higher' : 'Lower'} wins.`;
      if (e.step === 'med') {
        const asns = [...new Set(Object.values(e.neighborAs))];
        detail += ` Compared because all remaining paths come from AS ${asns.join(', ')}.`;
      }
      if (e.eliminated.length) detail += ` Out: ${e.eliminated.map((id) => `${id} (${e.values[id]})`).join(', ')}.`;
    }
    return { number: i + 1, step: e.step, name: cap(def.name), status: e.status, statusWord: STATUS_WORD[e.status], detail };
  });
}

export function explain(round, evaluation, content) {
  switch (evaluation.status) {
    case 'invalid-input':
      return { kind: 'guidance', heading: 'Choose a path', misconception: null, explanation: GUIDANCE, nextStep: null, message: GUIDANCE };
    case 'correct': {
      const message = correctMessage(evaluation.evidence);
      return { kind: 'correct', heading: 'Correct', misconception: null, explanation: message, nextStep: null, message };
    }
    case 'incorrect': {
      const wrong = round.wrongChoices[evaluation.chosen];
      const label = content.misconceptions[wrong.reasonCode].label;
      const message = `Not this one. Misconception: ${label}. ${wrong.explanation} ${NEXT_STEP}`;
      return { kind: 'incorrect', heading: 'Not this one', misconception: label, explanation: wrong.explanation, nextStep: NEXT_STEP, message };
    }
    default: {
      const message = `This challenge is unavailable: ${evaluation.reasonCode}.`;
      return { kind: 'content-error', heading: 'Challenge unavailable', misconception: null, explanation: message, nextStep: null, message };
    }
  }
}
