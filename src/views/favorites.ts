import { listDocuments, updateDocument, type DocRecord } from '../lib/db';
import { navigate } from '../router';

const TARGET_KEY = 'text-reader:target-paragraph';

interface FavoriteEntry {
  docId: number;
  docTitle: string;
  text: string;
}

export async function renderFavorites(root: HTMLElement): Promise<void> {
  const docs = await listDocuments();
  const favorites = collectFavorites(docs);

  root.innerHTML = `
    <header class="topbar">
      <button class="btn btn--ghost btn--icon" data-action="back" aria-label="戻る"><svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg></button>
      <h1 class="topbar__title">お気に入り <span class="topbar__count">${favorites.length}</span></h1>
    </header>

    <main class="favorites">
      ${
        favorites.length === 0
          ? `<p class="favorites__empty">まだお気に入りの段落がありません。<br />本文を長押しして保存できます。</p>`
          : `<ul class="favorites__list">${favorites.map(renderItem).join('')}</ul>`
      }
    </main>
  `;

  attachEvents(root, docs);
}

function collectFavorites(docs: DocRecord[]): FavoriteEntry[] {
  const out: FavoriteEntry[] = [];
  for (const d of docs) {
    if (typeof d.id !== 'number') continue;
    const saved = d.savedParagraphs;
    if (!saved || saved.length === 0) continue;
    for (const text of saved) {
      out.push({ docId: d.id, docTitle: d.title, text });
    }
  }
  return out;
}

function renderItem(f: FavoriteEntry): string {
  return `
    <li class="favorite" data-doc-id="${f.docId}" data-text="${escapeAttr(f.text)}">
      <button class="favorite__open" data-action="open-favorite">
        <div class="favorite__doc-title">${escapeHtml(f.docTitle)}</div>
        <div class="favorite__text">${escapeHtml(f.text)}</div>
      </button>
      <button class="favorite__remove" data-action="remove-favorite" aria-label="お気に入りから削除">✕</button>
    </li>
  `;
}

function attachEvents(root: HTMLElement, docs: DocRecord[]): void {
  const backBtn = root.querySelector<HTMLButtonElement>('[data-action="back"]');
  backBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (history.length > 1) history.back();
    else navigate('');
  });

  root.addEventListener('click', async (e) => {
    const actionEl = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    const li = (e.target as HTMLElement).closest<HTMLElement>('.favorite');

    if (action === 'open-favorite' && li) {
      const docId = Number(li.dataset.docId);
      const text = li.dataset.text || '';
      if (!Number.isFinite(docId)) return;
      sessionStorage.setItem(TARGET_KEY, text);
      navigate(`?doc=${docId}`);
    } else if (action === 'remove-favorite' && li) {
      const docId = Number(li.dataset.docId);
      const text = li.dataset.text || '';
      const doc = docs.find((d) => d.id === docId);
      if (!doc) return;
      const next = (doc.savedParagraphs ?? []).filter((t) => t !== text);
      doc.savedParagraphs = next;
      await updateDocument(docId, { savedParagraphs: next });
      li.remove();
      const list = root.querySelector<HTMLElement>('.favorites__list');
      const remaining = list?.querySelectorAll('.favorite').length ?? 0;
      const countEl = root.querySelector<HTMLElement>('.topbar__count');
      if (countEl) countEl.textContent = String(remaining);
      if (remaining === 0) {
        list?.remove();
        root.querySelector('.favorites')?.insertAdjacentHTML(
          'beforeend',
          `<p class="favorites__empty">まだお気に入りの段落がありません。<br />本文を長押しして保存できます。</p>`,
        );
      }
    }
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
