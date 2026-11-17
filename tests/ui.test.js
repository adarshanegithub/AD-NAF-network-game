// UI integration: mounts the real app in an off-screen container and drives it with DOM events.
// This checks wiring and text; it is not a substitute for the manual keyboard/visual checks.
import { test, eq, ok } from './runner.js';
import { ROUNDS } from './fixtures.js';
import { mountApp } from '../ui/controls.js';

const load = async () => (await fetch(new URL('../data/levels.json', import.meta.url))).json();

function mount(content) {
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-10000px;top:0;width:1000px';
  document.body.append(host);
  const app = mountApp(host, content, { reload: () => {} });
  return { host, app, q: (s) => host.querySelector(s), qa: (s) => [...host.querySelectorAll(s)], done: () => host.remove() };
}
const click = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
function pick(m, id) {
  const r = m.q(`input[value="${id}"]`);
  r.checked = true;
  r.dispatchEvent(new Event('change', { bubbles: true }));
}
const btn = (m, action, level) => m.q(`[data-action="${action}"]${level ? `[data-level="${level}"]` : ''}`);

test('ui Round 2.1 end to end: briefing, wrong B, retry A, ladder, Next', async () => {
  const doc = await load();
  const c = { ...doc, levels: [{ ...doc.levels[1], rounds: [doc.levels[1].rounds[0]] }] };
  const m = mount(c);
  try {
    ok(m.q('h1').textContent.startsWith('Level 2'), 'briefing first (AC1)');
    ok(!m.q('input[type="radio"][name="path"]'), 'no answer controls on the briefing');
    click(btn(m, 'start'));
    eq(m.q('h1').textContent, 'Round 2.1');
    eq(document.activeElement, m.q('h1'), 'focus moved to the round heading');
    ok(m.q('table.paths th[scope="col"]'), 'real table with column headers');
    eq(m.qa('fieldset.cards label').map((l) => l.textContent), ['Path A neighbor AS 64500', 'Path B neighbor AS 64501'], 'card names include label and neighbor AS');

    click(btn(m, 'submit'));
    ok(m.q('.feedback').textContent.includes('Pick a path before submitting.'), 'guidance (AC4)');
    eq(m.app.getState().rounds['2.1'].attempts, 0);

    pick(m, 'B');
    click(btn(m, 'submit'));
    const fb = m.q('.feedback');
    ok(fb.textContent.includes('Misconception: A shorter AS-path beats a higher local preference'), 'misconception named (AC3)');
    ok(fb.textContent.includes('A has 150 and B has 100'), 'values shown');
    eq(document.activeElement, m.q('#fb-heading'), 'focus on feedback');
    eq(m.host.querySelector('#live').textContent, `Not this one. Misconception: A shorter AS-path beats a higher local preference. ${ROUNDS['2.1'].wrong.B.explanation} Try again: start at weight and stop at the step that leaves one path.`, 'live region announces exact text');
    ok(btn(m, 'next').disabled, 'Next disabled while unsolved');

    pick(m, 'A');
    click(btn(m, 'submit'));
    eq(m.host.querySelector('#live').textContent, ROUNDS['2.1'].correct, 'correct text announced (AC2)');
    eq(m.qa('.feedback .gate .status').map((s) => s.textContent), ['tie', 'decides', 'not reached', 'not reached', 'not reached'], 'ladder words (AC2, AC10)');
    ok(btn(m, 'submit').disabled, 'Submit disabled after success');
    ok(!btn(m, 'next').disabled, 'Next enabled');
    click(btn(m, 'submit'));
    eq(m.app.getState().rounds['2.1'].attempts, 2, 'repeat submit ignored (AC6)');
  } finally { m.done(); }
});

test('ui help buttons unlock in order and the hint shows only the method (AC5)', async () => {
  const c = await load();
  const m = mount(c);
  try {
    click(btn(m, 'start'));
    ok(!btn(m, 'help', '1').disabled && btn(m, 'help', '2').disabled && btn(m, 'help', '3').disabled, 'only Hint available');
    click(btn(m, 'help', '1'));
    eq(m.qa('.help-item').length, 1);
    eq(m.q('.help-item p').textContent, c.method, 'method only');
    ok(!m.q('.help .ladder'), 'no ladder with the hint');
    ok(btn(m, 'help', '3').disabled, 'solution still locked');
    click(btn(m, 'help', '2'));
    eq(m.qa('.help-item')[1].querySelector('p').textContent, ROUNDS['1.1'].workedStep, 'worked step');
    click(btn(m, 'help', '3'));
    ok(m.q('.help .ladder'), 'worked solution ladder');
    eq(m.app.getState().rounds['1.1'], { attempts: 0, solved: false, helpLevel: 3, lastResult: null }, 'recorded, not solved');
  } finally { m.done(); }
});

test('ui full playthrough reaches the session summary with separate figures (AC7)', async () => {
  const c = await load();
  const m = mount(c);
  const winners = Object.fromEntries(Object.entries(ROUNDS).map(([k, v]) => [k, v.survivor]));
  try {
    const seen = [];
    for (let l = 0; l < 3; l++) {
      click(btn(m, 'start'));
      for (let r = 0; r < 2; r++) {
        const id = m.q('h1').textContent.replace('Round ', '');
        pick(m, winners[id]);
        click(btn(m, 'submit'));
        click(btn(m, 'next'));
      }
      seen.push(m.q('h1').textContent);
      click(btn(m, 'next'));
    }
    eq(seen, ['Level 1 complete', 'Level 2 complete', 'Level 3 complete']);
    eq(m.q('h1').textContent, 'Session summary');
    eq(m.qa('.figures dd').map((d) => d.textContent), ['6 of 6', '6', '0 help views in 0 rounds']);
  } finally { m.done(); }
});

test('ui restart: cancel keeps progress, confirm returns to first briefing (AC8)', async () => {
  const c = await load();
  const m = mount(c);
  try {
    click(btn(m, 'start'));
    pick(m, 'A');
    click(btn(m, 'submit'));
    click(btn(m, 'restart-open'));
    ok(m.q('#restart-dialog').open, 'confirmation shown');
    click(m.q('[data-action="restart-cancel"]'));
    ok(!m.q('#restart-dialog').open, 'dialog closed');
    eq(m.app.getState().rounds['1.1'].attempts, 1, 'cancel preserves session');
    eq(document.activeElement, m.q('#restart'), 'focus returns to Restart');
    click(btn(m, 'restart-open'));
    click(m.q('[data-action="restart-confirm"]'));
    eq(m.q('h1').textContent, 'Level 1: One step decides');
    eq(m.app.getState().rounds['1.1'].attempts, 0, 'cleared');
  } finally { m.done(); }
});

test('ui every interactive control is a native, focusable element with a name (AC9)', async () => {
  const c = await load();
  const m = mount(c);
  try {
    click(btn(m, 'start'));
    for (const el of m.qa('button, input, a, [tabindex="0"]')) {
      const name = el.getAttribute('aria-label') || el.textContent.trim() || (el.id && m.q(`label[for="${el.id}"]`)?.textContent.trim());
      ok(name, `accessible name for ${el.outerHTML.slice(0, 60)}`);
    }
    ok(m.q('.table-scroll[role="region"][aria-label][tabindex="0"]'), 'scrollable table region is labeled and focusable');
  } finally { m.done(); }
});
