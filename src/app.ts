import { currentParams } from './router';
import { initTheme, applyReadingPrefs } from './lib/theme';
import { clearArticleMeta } from './lib/meta';
import { renderLibrary } from './views/library';
import { renderReader } from './views/reader';
import { renderSettings } from './views/settings';

let initialized = false;

function swapRoot(): HTMLElement {
  const root = document.createElement('div');
  root.id = 'app';
  const old = document.getElementById('app');
  if (old && old.parentNode) {
    old.replaceWith(root);
  } else {
    document.body.appendChild(root);
  }
  return root;
}

export async function renderApp(): Promise<void> {
  const root = swapRoot();

  if (!initialized) {
    initTheme();
    applyReadingPrefs();
    initialized = true;
  }

  clearArticleMeta();

  const params = currentParams();
  const view = params.get('view');
  const doc = params.get('doc');

  if (view === 'settings') {
    renderSettings(root);
    return;
  }

  if (doc) {
    const id = Number(doc);
    if (Number.isFinite(id)) {
      await renderReader(root, id);
      return;
    }
  }

  await renderLibrary(root);
}
