import { currentParams } from './router';
import { initTheme, applyReadingPrefs } from './lib/theme';
import { clearArticleMeta } from './lib/meta';
import { renderFavorites } from './views/favorites';
import { renderLibrary } from './views/library';
import { renderReader } from './views/reader';
import { renderSettings } from './views/settings';

let initialized = false;

export async function renderApp(root: HTMLElement): Promise<void> {
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

  if (view === 'favorites') {
    await renderFavorites(root);
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
