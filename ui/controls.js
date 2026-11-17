// Event wiring, focus movement, and live-region announcements.
import { initialState, reduce } from '../engine/state.js';
import { h, headerBar, briefingView, roundView, levelSummaryView, sessionSummaryView } from './render.js';

export function mountApp(root, content, { reload = () => location.reload() } = {}) {
  let state = initialState(content);
  let focusTarget = 'heading';

  const live = h('div', { class: 'visually-hidden', 'aria-live': 'polite', 'aria-atomic': 'true', id: 'live' });
  const dialog = h('dialog', { id: 'restart-dialog', 'aria-labelledby': 'restart-title' },
    h('h2', { id: 'restart-title', text: 'Restart the session?' }),
    h('p', { text: 'This clears all progress, attempts, and help, and returns to the first briefing.' }),
    h('div', { class: 'actions' },
      h('button', { type: 'button', class: 'primary', 'data-action': 'restart-confirm', text: 'Restart' }),
      h('button', { type: 'button', class: 'secondary', 'data-action': 'restart-cancel', text: 'Cancel' })));
  const main = h('main', { id: 'app' });
  root.replaceChildren(main, live, dialog);

  function render() {
    const view = {
      briefing: briefingView,
      round: roundView,
      'level-summary': levelSummaryView,
      'session-summary': sessionSummaryView,
    }[state.view](content, state);
    main.replaceChildren(headerBar(content, state), view);
    const target = main.querySelector(`[data-focus="${focusTarget}"]`) || main.querySelector('[data-focus="heading"]');
    if (target && focusTarget) target.focus();
    focusTarget = null;
  }

  function dispatch(action) {
    const prev = state;
    state = reduce(state, action, content);
    if (state === prev) return;
    if (action.type === 'submit' && state.feedback) {
      live.textContent = state.feedback.message;
      focusTarget = 'feedback';
    } else if (action.type === 'start' || action.type === 'next' || action.type === 'restart') {
      live.textContent = '';
      focusTarget = 'heading';
    } else if (action.type === 'select') {
      focusTarget = null;
    }
    render();
    if (action.type === 'select') {
      const radio = main.querySelector(`input[value="${action.pathId}"]`);
      if (radio) radio.focus();
    }
    if (action.type === 'help') {
      const items = main.querySelectorAll('.help-item');
      const last = items[items.length - 1];
      if (last) {
        const heading = last.querySelector('h3');
        heading.setAttribute('tabindex', '-1');
        heading.focus();
        live.textContent = last.textContent;
      }
    }
  }

  function openRestart() {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    dialog.querySelector('[data-action="restart-confirm"]').focus();
  }
  function closeRestart() {
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  }

  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const a = el.dataset.action;
    if (a === 'start') dispatch({ type: 'start' });
    else if (a === 'submit') dispatch({ type: 'submit' });
    else if (a === 'next') dispatch({ type: 'next' });
    else if (a === 'help') dispatch({ type: 'help' });
    else if (a === 'reload') reload();
    else if (a === 'restart-open') openRestart();
    else if (a === 'restart-confirm') { closeRestart(); dispatch({ type: 'restart' }); }
    else if (a === 'restart-cancel') { closeRestart(); main.querySelector('#restart').focus(); }
  });

  root.addEventListener('change', (e) => {
    if (e.target.matches('input[type="radio"][data-action="select"]')) dispatch({ type: 'select', pathId: e.target.value });
  });

  dialog.addEventListener('cancel', () => {
    // Escape key: same as Cancel.
    setTimeout(() => main.querySelector('#restart')?.focus(), 0);
  });

  render();
  return { getState: () => state, dispatch, root };
}
