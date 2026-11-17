// View rendering. Builds DOM nodes; never uses innerHTML for content.
import { selectBestPath, STEPS, neighborAs } from '../engine/rules.js';
import { workedStep, ladderRows } from '../engine/feedback.js';
import { currentLevel, currentRound, levelSummary, sessionSummary, HELP_MAX } from '../engine/state.js';

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('data-')) el.setAttribute(k, v);
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

const GATE_LABEL = { weight: 'WEIGHT', localPref: 'LOCAL PREF', asPathLength: 'AS-PATH', origin: 'ORIGIN', med: 'MED' };
const DIRECTION = (def) => (def.higherWins ? '↑ higher wins' : '↓ lower wins');

export function stepOrder() {
  return h('ol', { class: 'step-order', 'aria-label': 'Best-path steps, checked in order' },
    STEPS.map((d) => h('li', {}, h('span', { class: 'gate-name', text: GATE_LABEL[d.step] }), ' ', h('span', { class: 'dir', text: DIRECTION(d) }))));
}

function asPathCell(p) {
  const [first, ...rest] = p.asPath;
  return h('td', {},
    h('mark', { class: 'neighbor', title: 'Neighboring AS' }, String(first)),
    rest.length ? ' ' + rest.join(' ') : '',
    h('span', { class: 'len', text: ` (length ${p.asPath.length})` }));
}

export function candidateTable(candidates, caption) {
  return h('div', { class: 'table-wrap' },
    h('p', { class: 'scroll-hint', 'aria-hidden': 'true', text: 'Scroll the table sideways to see AS-path, origin, and MED →' }),
    h('div', { class: 'table-scroll', role: 'region', 'aria-label': `${caption} (scrollable)`, tabindex: '0' },
    h('table', { class: 'paths' },
      h('caption', { text: caption }),
      h('thead', {}, h('tr', {}, ['Path', 'Peer', 'Neighbor AS', 'Weight ↑', 'Local pref ↑', 'AS-path ↓', 'Origin ↓', 'MED ↓'].map((t) => h('th', { scope: 'col', text: t })))),
      h('tbody', {}, candidates.map((p) => h('tr', {},
        h('th', { scope: 'row', text: p.id }),
        h('td', { text: p.peer }),
        h('td', { text: String(neighborAs(p)) }),
        h('td', { text: String(p.weight) }),
        h('td', { text: String(p.localPref) }),
        asPathCell(p),
        h('td', { text: p.origin }),
        h('td', { text: String(p.med) })))))),
    );
}

function stampFor(entry, row) {
  if (entry.status === 'not-reached') return '';
  if (entry.step === 'med') {
    const asns = [...new Set(Object.values(entry.neighborAs))];
    return `Same AS ${asns.join(', ')}: compare MED`;
  }
  if (entry.eliminated.length) {
    const def = STEPS.find((d) => d.step === entry.step);
    const op = def.higherWins ? '<' : '>';
    return entry.eliminated.map((id) => `${GATE_LABEL[entry.step]} ${entry.values[id]} ${op} ${entry.best}`).join(' · ');
  }
  return '';
}

export function ladder(result, heading = 'Step ladder') {
  const rows = ladderRows(result);
  return h('section', { class: 'ladder', 'aria-label': heading },
    h('h3', { text: heading }),
    h('ol', { class: 'gates' }, rows.map((row, i) => {
      const entry = result.ladder[i];
      return h('li', { class: `gate gate-${row.status}`, style: `--i:${i}` },
        h('div', { class: 'gate-head' },
          h('span', { class: 'gate-name', text: `${row.number}. ${GATE_LABEL[row.step]}` }),
          h('span', { class: `status status-${row.status}`, text: row.statusWord })),
        row.detail ? h('p', { class: 'gate-detail', text: row.detail }) : h('p', { class: 'gate-detail muted', text: 'Not reached: an earlier step already decided.' }),
        stampFor(entry, row) ? h('p', { class: 'stamp', 'aria-hidden': 'true', text: stampFor(entry, row) }) : null);
    })));
}

export function headerBar(content, state) {
  const level = currentLevel(state, content);
  return h('header', { class: 'topbar' },
    h('p', { class: 'brand', text: 'AS You Were' }),
    h('p', { class: 'where', text: `Level ${level.id} of ${content.levels.length} · ${level.title}` }),
    h('button', { type: 'button', class: 'secondary', id: 'restart', 'data-action': 'restart-open', text: 'Restart' }));
}

export function briefingView(content, state) {
  const level = currentLevel(state, content);
  const b = level.briefing;
  const ex = b.example;
  const exResult = selectBestPath(ex.candidates);
  return h('section', { class: 'view briefing' },
    h('h1', { tabindex: '-1', 'data-focus': 'heading', text: `Level ${level.id}: ${level.title}` }),
    h('p', { class: 'concept', text: b.concept }),
    stepOrder(),
    h('h2', { text: 'Worked example' }),
    candidateTable(ex.candidates, 'Worked example paths to 203.0.113.0/24'),
    h('p', { class: 'example-answer' }, h('strong', { text: `Installed path: ${ex.winner}. ` }), ex.explanation),
    ladder(exResult, 'Worked example step ladder'),
    h('p', { class: 'sources' }, 'Sources: ', sourceLinks(content, b.sourceIds)),
    h('div', { class: 'actions' }, h('button', { type: 'button', class: 'primary', 'data-action': 'start', text: 'Start the challenge' })));
}

function sourceLinks(content, ids) {
  const out = [];
  ids.forEach((id, i) => {
    const s = content.sources.find((x) => x.id === id);
    if (!s) return;
    if (i) out.push('; ');
    out.push(h('a', { href: s.url, target: '_blank', rel: 'noopener', text: `${s.title}, ${s.section}` }));
  });
  return out;
}

export function roundView(content, state) {
  const level = currentLevel(state, content);
  const round = currentRound(state, content);
  const rs = state.rounds[round.id];
  const fb = state.feedback;
  const roundNo = state.roundIndex + 1;

  const cards = h('fieldset', { class: 'cards' },
    h('legend', { text: 'Which path does the router install?' }),
    round.candidates.map((p) => {
      const id = `pick-${p.id}`;
      return h('div', { class: 'card' + (state.selection === p.id ? ' selected' : '') },
        h('input', { type: 'radio', name: 'path', id, value: p.id, checked: state.selection === p.id, disabled: rs.solved, 'data-action': 'select' }),
        h('label', { for: id }, h('span', { class: 'card-title', text: `Path ${p.id}` }), h('span', { class: 'card-sub', text: ` neighbor AS ${neighborAs(p)}` })));
    }));

  const help = [];
  if (rs.helpLevel >= 1) help.push(h('div', { class: 'help-item' }, h('h3', { text: 'Hint: the method' }), h('p', { text: content.method })));
  if (rs.helpLevel >= 2) help.push(h('div', { class: 'help-item' }, h('h3', { text: 'Worked step' }), h('p', { text: workedStep(selectBestPath(round.candidates)) })));
  if (rs.helpLevel >= 3) help.push(h('div', { class: 'help-item' }, ladder(selectBestPath(round.candidates), 'Worked solution: full step ladder')));

  const helpButtons = h('div', { class: 'help-buttons', role: 'group', 'aria-label': 'Help' },
    h('button', { type: 'button', class: 'secondary', 'data-action': 'help', 'data-level': '1', disabled: rs.helpLevel >= 1, text: rs.helpLevel >= 1 ? 'Hint shown' : 'Hint' }),
    h('button', { type: 'button', class: 'secondary', 'data-action': 'help', 'data-level': '2', disabled: rs.helpLevel !== 1, text: rs.helpLevel >= 2 ? 'Worked step shown' : 'Worked step' }),
    h('button', { type: 'button', class: 'secondary', 'data-action': 'help', 'data-level': '3', disabled: rs.helpLevel !== 2, text: rs.helpLevel >= 3 ? 'Worked solution shown' : 'Worked solution' }));

  let feedback = null;
  if (fb) {
    feedback = h('section', { class: `feedback feedback-${fb.kind}`, 'aria-labelledby': 'fb-heading' },
      h('h2', { id: 'fb-heading', tabindex: '-1', 'data-focus': 'feedback', text: fb.kind === 'correct' ? '✓ Correct' : fb.kind === 'incorrect' ? '✗ Not this one' : fb.heading }),
      fb.misconception ? h('p', { class: 'misconception' }, h('strong', { text: 'Misconception: ' }), fb.misconception) : null,
      fb.kind === 'correct' ? h('p', { text: fb.message.replace(/^Correct\. /, '') }) : h('p', { text: fb.explanation }),
      fb.nextStep ? h('p', { class: 'next-step', text: fb.nextStep }) : null,
      fb.kind === 'correct' ? ladder(fb.evaluation.evidence) : null);
  }

  return h('section', { class: 'view round' },
    h('h1', { tabindex: '-1', 'data-focus': 'heading', text: `Round ${round.id}` }),
    h('p', { class: 'meta' },
      h('span', { text: `Level ${level.id}, round ${roundNo} of ${level.rounds.length}` }), ' · ',
      h('span', { text: `Difficulty ${round.difficulty} of 3` }), ' · ',
      h('span', { text: `Prefix ${round.prefix}` }), ' · ',
      h('span', { text: `Attempts ${rs.attempts}` })),
    h('p', { class: 'task', text: 'Several paths to the same prefix arrived at this Cisco IOS router. Pick the one it installs.' }),
    stepOrder(),
    candidateTable(round.candidates, `Candidate paths to ${round.prefix}`),
    h('div', { class: 'decision' },
      cards,
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'primary', 'data-action': 'submit', disabled: rs.solved, text: 'Submit' }),
        helpButtons,
        h('button', { type: 'button', class: 'primary', 'data-action': 'next', disabled: !rs.solved, text: 'Next' }))),
    feedback,
    help.length ? h('section', { class: 'help', 'aria-label': 'Help' }, help) : null);
}

function figures(sum) {
  return h('dl', { class: 'figures' },
    h('div', {}, h('dt', { text: 'Completed rounds' }), h('dd', { text: `${sum.completed} of ${sum.rounds}` })),
    h('div', {}, h('dt', { text: 'Valid attempts' }), h('dd', { text: String(sum.attempts) })),
    h('div', {}, h('dt', { text: 'Help used' }), h('dd', { text: `${sum.helpViews} help ${sum.helpViews === 1 ? 'view' : 'views'} in ${sum.roundsWithHelp} ${sum.roundsWithHelp === 1 ? 'round' : 'rounds'}` })));
}

export function levelSummaryView(content, state) {
  const level = currentLevel(state, content);
  const last = state.levelIndex + 1 >= content.levels.length;
  return h('section', { class: 'view summary' },
    h('h1', { tabindex: '-1', 'data-focus': 'heading', text: `Level ${level.id} complete` }),
    figures(levelSummary(state, content)),
    h('p', { class: 'muted', text: 'Completion is not proof of independent mastery: attempts and help are shown separately.' }),
    h('div', { class: 'actions' }, h('button', { type: 'button', class: 'primary', 'data-action': 'next', text: last ? 'See session summary' : `Go to Level ${Number(level.id) + 1}` })));
}

export function sessionSummaryView(content, state) {
  return h('section', { class: 'view summary' },
    h('h1', { tabindex: '-1', 'data-focus': 'heading', text: 'Session summary' }),
    figures(sessionSummary(state, content)),
    h('table', { class: 'per-round' },
      h('caption', { text: 'Per round' }),
      h('thead', {}, h('tr', {}, ['Round', 'Completed', 'Attempts', 'Help views'].map((t) => h('th', { scope: 'col', text: t })))),
      h('tbody', {}, content.levels.flatMap((l) => l.rounds).map((r) => {
        const s = state.rounds[r.id];
        return h('tr', {}, h('th', { scope: 'row', text: r.id }), h('td', { text: s.solved ? 'Yes' : 'No' }), h('td', { text: String(s.attempts) }), h('td', { text: `${s.helpLevel} of ${HELP_MAX}` }));
      }))),
    h('p', { class: 'muted', text: 'Use Restart to play again from the first briefing.' }));
}

export function contentErrorView(errors) {
  return h('section', { class: 'view error' },
    h('h1', { tabindex: '-1', 'data-focus': 'heading', text: 'The game content has errors' }),
    h('p', { text: 'The game did not start, so nothing was graded and no progress was recorded. Fix these authoring errors in data/levels.json:' }),
    h('ul', {}, errors.map((e) => h('li', { text: `${e.levelId ? `Level ${e.levelId}` : 'Document'}${e.roundId ? `, round ${e.roundId}` : ''} · ${e.field}: ${e.problem}` }))),
    h('div', { class: 'actions' }, h('button', { type: 'button', class: 'primary', 'data-action': 'reload', text: 'Retry loading' })));
}

export function loadErrorView(message) {
  return h('section', { class: 'view error' },
    h('h1', { tabindex: '-1', 'data-focus': 'heading', text: 'The game could not load' }),
    h('p', { text: `${message} Make sure you opened the game through the local web server (python3 -m http.server 8000), not as a file.` }),
    h('div', { class: 'actions' }, h('button', { type: 'button', class: 'primary', 'data-action': 'reload', text: 'Retry loading' })));
}
