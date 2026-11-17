// Load → validate all content → start, or show the error screen (spec FR-005).
import { validateContent } from './engine/content.js';
import { mountApp } from './ui/controls.js';
import { contentErrorView, loadErrorView } from './ui/render.js';

export async function loadContent(url) {
  let res;
  try {
    res = await fetch(url, { cache: 'no-store' });
  } catch {
    return { ok: false, message: 'The content file could not be fetched.' };
  }
  if (!res.ok) return { ok: false, message: `The content file returned HTTP ${res.status}.` };
  try {
    return { ok: true, doc: await res.json() };
  } catch {
    return { ok: false, message: 'The content file is not valid JSON.' };
  }
}

function showStatic(root, view) {
  const main = document.createElement('main');
  main.id = 'app';
  main.append(view);
  root.replaceChildren(main);
  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="reload"]')) location.reload();
  });
  main.querySelector('[data-focus="heading"]')?.focus();
}

export async function start(root, url = new URL('./data/levels.json', import.meta.url)) {
  const loaded = await loadContent(url);
  if (!loaded.ok) {
    showStatic(root, loadErrorView(loaded.message));
    return null;
  }
  const check = validateContent(loaded.doc);
  if (!check.ok) {
    showStatic(root, contentErrorView(check.errors));
    return null;
  }
  return mountApp(root, loaded.doc);
}

const root = document.getElementById('root');
if (root) {
  const override = new URLSearchParams(location.search).get('content');
  // ?content= lets a reviewer load a deliberately broken copy (quickstart step 8); same-origin relative paths only.
  const url = override && /^[\w./-]+\.json$/.test(override) && !override.includes('..')
    ? new URL(override, location.href)
    : new URL('./data/levels.json', import.meta.url);
  start(root, url);
}
