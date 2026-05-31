import {
  deleteDocument,
  listDocuments,
  setArchived,
  setStarred,
  getStorageEstimate,
  type BookmarkEntry,
  type DocRecord,
} from '../lib/db';
import { importFiles, importRawText } from '../lib/import';
import { getBlockTexts } from '../lib/parser';
import { getLocale, t } from '../lib/i18n';
import { navigate } from '../router';

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString(getLocale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

type FilterMode = 'all' | 'starred' | 'bookmarked' | 'archived';

function filterLabel(m: FilterMode): string {
  return t(`library.filter.${m}`);
}

const ICON_SETTINGS = `<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
const ICON_SEARCH = `<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`;
const ICON_FILTER = `<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>`;
const ICON_MENU = `<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>`;
const ICON_ARCHIVE = `<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/></svg>`;
const ICON_UNARCHIVE = `<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M12 18V11"/><path d="m9 14 3-3 3 3"/></svg>`;
const ICON_TRASH = `<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
const ICON_BOOKMARK = `<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
const ICON_BOOKMARK_OUTLINE = `<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
const ICON_STAR_OUTLINE = `<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const ICON_LIBRARY = `<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4v16"/><path d="M8 7v13"/><rect x="11" y="5" width="9" height="15" rx="1"/></svg>`;

const FILTER_ICONS: Record<FilterMode, string> = {
  all: ICON_LIBRARY,
  starred: ICON_STAR_OUTLINE,
  bookmarked: ICON_BOOKMARK_OUTLINE,
  archived: ICON_ARCHIVE,
};

let searchQuery = '';
let searchOpen = false;
let filterMode: FilterMode = 'all';
let cachedDocs: DocRecord[] = [];
let libraryAbort: AbortController | null = null;

export async function renderLibrary(root: HTMLElement): Promise<void> {
  libraryAbort?.abort();
  libraryAbort = new AbortController();
  const signal = libraryAbort.signal;

  const docs = await listDocuments();
  cachedDocs = docs;
  const estimate = await getStorageEstimate();
  const visible = applyFilters(docs);
  const bookmarkItems = filterMode === 'bookmarked' ? collectBookmarkItems(visible) : [];
  const displayCount = filterMode === 'bookmarked' ? bookmarkItems.length : visible.length;

  root.innerHTML = `
    <header class="topbar">
      <h1 class="topbar__title">Text Reader</h1>
      <div class="topbar__actions">
        <button class="btn btn--ghost btn--icon" data-action="open-settings" aria-label="${t('common.settings')}">${ICON_SETTINGS}</button>
      </div>
    </header>
    <main class="library">
      <p class="library__intro">${t('library.intro')}</p>
      <section class="upload" aria-label="${t('library.upload.aria')}">
        <label class="upload__drop" id="drop-zone">
          <input type="file" id="file-input" accept=".txt,.md,.markdown,text/plain,text/markdown" multiple hidden />
          <div class="upload__icon" aria-hidden="true">＋</div>
          <div class="upload__primary">${t('library.upload.primary')}</div>
          <div class="upload__hint">${t('library.upload.hint')}</div>
        </label>
        <details class="upload__paste">
          <summary>${t('library.paste.summary')}</summary>
          <textarea id="paste-area" rows="6" placeholder="${t('library.paste.placeholder')}"></textarea>
          <div class="upload__paste-actions">
            <input type="text" id="paste-title" placeholder="${t('library.paste.title')}" />
            <button class="btn btn--primary" data-action="add-pasted">${t('library.paste.add')}</button>
          </div>
        </details>
      </section>

      <section class="docs" aria-label="${t('library.filter.all')}">
        <div class="docs__header">
          <h2 class="docs__heading">${headingLabel()} <span class="docs__count">${displayCount}</span></h2>
          <button class="btn btn--ghost btn--icon docs__search-toggle" data-action="toggle-search" aria-label="${t('library.search')}" aria-expanded="${searchOpen}">${ICON_SEARCH}</button>
          <div class="docs__menu-wrap">
            <button class="btn btn--ghost btn--icon docs__filter-toggle${filterMode !== 'all' ? ' is-active' : ''}" data-action="toggle-filter" aria-label="${t('library.filter')}" aria-haspopup="menu" aria-expanded="false">${ICON_FILTER}</button>
            <div class="docs__filter-menu" hidden role="menu">
              ${renderFilterMenuItems()}
            </div>
          </div>
        </div>
        <div class="docs__search" ${searchOpen ? '' : 'hidden'}>
          <input type="search" id="search-input" class="docs__search-input" placeholder="${t('library.search.placeholder')}" value="${escapeHtml(searchQuery)}" />
          <button class="docs__search-clear" data-action="clear-search" aria-label="${t('library.search.clear')}" ${searchQuery ? '' : 'hidden'}>✕</button>
        </div>
        ${renderListSection(docs, visible, bookmarkItems)}
      </section>

      ${renderStorageInfo(estimate)}
    </main>
  `;

  attachLibraryEvents(root, signal);
}

function headingLabel(): string {
  return filterLabel(filterMode);
}

function renderFilterMenuItems(): string {
  return (['all', 'starred', 'bookmarked', 'archived'] as const)
    .map(
      (m) => `
      <button class="docs__filter-item${filterMode === m ? ' is-selected' : ''}" data-action="set-filter" data-filter="${m}" role="menuitemradio" aria-checked="${filterMode === m}">
        <span class="docs__filter-icon">${FILTER_ICONS[m]}</span>
        <span class="docs__filter-label">${filterLabel(m)}</span>
      </button>
    `,
    )
    .join('');
}

function renderListSection(
  allDocs: DocRecord[],
  visible: DocRecord[],
  bookmarkItems: BookmarkItem[] = [],
): string {
  if (allDocs.length === 0) {
    return `<p class="docs__empty">${t('library.empty.noDocs')}</p>`;
  }
  if (filterMode === 'bookmarked') {
    if (bookmarkItems.length === 0) {
      return `<p class="docs__empty">${emptyMessage()}</p>`;
    }
    return `<ul class="docs__list docs__list--bookmarks">${bookmarkItems.map(renderBookmarkRow).join('')}</ul>`;
  }
  if (visible.length === 0) {
    return `<p class="docs__empty">${emptyMessage()}</p>`;
  }
  return `<ul class="docs__list">${visible.map(renderItem).join('')}</ul>`;
}

interface BookmarkItem {
  doc: DocRecord;
  entry: BookmarkEntry;
  text: string;
}

function collectBookmarkItems(docs: DocRecord[]): BookmarkItem[] {
  const items: BookmarkItem[] = [];
  const textCache = new Map<number, string[]>();
  for (const doc of docs) {
    const entries = doc.bookmarks ?? [];
    if (entries.length === 0) continue;
    let texts = textCache.get(doc.id!);
    if (!texts) {
      try {
        texts = getBlockTexts(doc.format, doc.content);
      } catch {
        texts = [];
      }
      textCache.set(doc.id!, texts);
    }
    for (const entry of entries) {
      if (entry.index < 0 || entry.index >= texts.length) continue;
      const text = texts[entry.index];
      if (!text) continue;
      items.push({ doc, entry, text });
    }
  }
  items.sort((a, b) => b.entry.addedAt - a.entry.addedAt);
  return items;
}

function emptyMessage(): string {
  if (searchQuery.trim()) return t('library.empty.noMatch');
  switch (filterMode) {
    case 'starred':
      return t('library.empty.starred');
    case 'bookmarked':
      return t('library.empty.bookmarked');
    case 'archived':
      return t('library.empty.archived');
    default:
      return t('library.empty.noMatch');
  }
}

function applyFilters(docs: DocRecord[]): DocRecord[] {
  let result: DocRecord[];
  switch (filterMode) {
    case 'archived':
      result = docs.filter((d) => d.archived);
      break;
    case 'starred':
      result = docs.filter((d) => !d.archived && d.starred);
      break;
    case 'bookmarked':
      result = docs.filter((d) => !d.archived && (d.bookmarks?.length ?? 0) > 0);
      break;
    default:
      result = docs.filter((d) => !d.archived);
  }
  const q = searchQuery.trim().toLowerCase();
  if (q) result = result.filter((d) => d.title.toLowerCase().includes(q));
  return result;
}

function renderItem(d: DocRecord): string {
  const starred = !!d.starred;
  const archived = !!d.archived;
  return `
    <li class="doc-item${archived ? ' doc-item--archived' : ''}" data-id="${d.id}">
      <article class="doc${starred ? ' doc--starred' : ''}">
        <button class="doc__star" data-action="toggle-star" data-id="${d.id}" aria-label="${starred ? t('doc.star.remove') : t('doc.star.add')}" aria-pressed="${starred}">${starIcon(starred)}</button>
        <button class="doc__open" data-action="open" data-id="${d.id}">
          <div class="doc__title">${escapeHtml(d.title)}</div>
          <div class="doc__meta">
            <span class="doc__format">${d.format.toUpperCase()}</span>
            <span class="doc__size">${fmtSize(d.byteSize)}</span>
            <span class="doc__date">${fmtDate(d.updatedAt)}</span>
          </div>
        </button>
        <button class="doc__menu-btn" data-action="toggle-item-menu" data-id="${d.id}" aria-label="${t('doc.menu')}" aria-haspopup="menu" aria-expanded="false">${ICON_MENU}</button>
      </article>
      ${renderItemMenu(d.id!, archived)}
    </li>
  `;
}

function renderBookmarkRow({ doc, text }: BookmarkItem): string {
  return `
    <li class="bm-row" data-id="${doc.id}">
      <button class="bm-row__main" data-action="open" data-id="${doc.id}">
        <p class="bm-row__quote">${escapeHtml(truncate(text, 280))}</p>
        <footer class="bm-row__source">
          <span class="bm-row__source-icon" aria-hidden="true">${ICON_BOOKMARK}</span>
          <span class="bm-row__source-title">${escapeHtml(doc.title)}</span>
        </footer>
      </button>
    </li>
  `;
}

function renderItemMenu(id: number, archived: boolean): string {
  const items = archived
    ? `
        <button class="doc-item__menu-item" data-action="unarchive" data-id="${id}" role="menuitem"><span class="doc-item__menu-icon">${ICON_UNARCHIVE}</span>${t('doc.unarchive')}</button>
        <button class="doc-item__menu-item doc-item__menu-item--danger" data-action="delete" data-id="${id}" role="menuitem"><span class="doc-item__menu-icon">${ICON_TRASH}</span>${t('doc.delete')}</button>
      `
    : `
        <button class="doc-item__menu-item" data-action="archive" data-id="${id}" role="menuitem"><span class="doc-item__menu-icon">${ICON_ARCHIVE}</span>${t('doc.archive')}</button>
        <button class="doc-item__menu-item doc-item__menu-item--danger" data-action="delete" data-id="${id}" role="menuitem"><span class="doc-item__menu-icon">${ICON_TRASH}</span>${t('doc.delete')}</button>
      `;
  return `<div class="doc-item__menu" data-menu-for="${id}" hidden role="menu">${items}</div>`;
}

function truncate(s: string, max: number): string {
  const collapsed = s.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= max) return collapsed;
  return collapsed.slice(0, max - 1).trimEnd() + '…';
}

function starIcon(filled: boolean): string {
  return `<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
}

function renderStorageInfo(estimate: StorageEstimate | null): string {
  if (!estimate || !estimate.quota) return '';
  const usedMB = ((estimate.usage ?? 0) / 1024 / 1024).toFixed(2);
  const quotaMB = (estimate.quota / 1024 / 1024).toFixed(0);
  const pct = estimate.quota
    ? Math.min(100, ((estimate.usage ?? 0) / estimate.quota) * 100)
    : 0;
  return `
    <section class="storage" aria-label="${t('library.storage.aria')}">
      <div class="storage__label">${t('library.storage.label', { used: usedMB, quota: quotaMB })}</div>
      <div class="storage__bar" role="progressbar" aria-valuenow="${pct.toFixed(0)}" aria-valuemin="0" aria-valuemax="100">
        <div class="storage__fill" style="width:${pct.toFixed(2)}%"></div>
      </div>
    </section>
  `;
}

function closeAllMenus(root: HTMLElement) {
  root
    .querySelectorAll<HTMLElement>('.doc-item__menu:not([hidden]), .docs__filter-menu:not([hidden])')
    .forEach((m) => {
      m.setAttribute('hidden', '');
    });
  root
    .querySelectorAll<HTMLElement>('[aria-expanded="true"][data-action="toggle-item-menu"], [aria-expanded="true"][data-action="toggle-filter"]')
    .forEach((b) => b.setAttribute('aria-expanded', 'false'));
}

function attachLibraryEvents(root: HTMLElement, signal: AbortSignal) {
  const fileInput = root.querySelector<HTMLInputElement>('#file-input');
  const dropZone = root.querySelector<HTMLLabelElement>('#drop-zone');

  fileInput?.addEventListener(
    'change',
    async () => {
      if (!fileInput.files) return;
      const ids = await importFiles(fileInput.files);
      if (ids.length === 1) {
        navigate(`?doc=${ids[0]}`);
      } else {
        navigate('');
      }
    },
    { signal },
  );

  if (dropZone) {
    dropZone.addEventListener(
      'dragover',
      (e) => {
        e.preventDefault();
        dropZone.classList.add('upload__drop--over');
      },
      { signal },
    );
    dropZone.addEventListener(
      'dragleave',
      () => {
        dropZone.classList.remove('upload__drop--over');
      },
      { signal },
    );
    dropZone.addEventListener(
      'drop',
      async (e) => {
        e.preventDefault();
        dropZone.classList.remove('upload__drop--over');
        const files = e.dataTransfer?.files;
        if (!files || files.length === 0) return;
        const ids = await importFiles(files);
        if (ids.length === 1) navigate(`?doc=${ids[0]}`);
        else navigate('');
      },
      { signal },
    );
  }

  root.addEventListener(
    'click',
    async (e) => {
      const target = e.target as HTMLElement;
      const actionEl = target.closest<HTMLElement>('[data-action]');
      const action = actionEl?.dataset.action;

      // 開いているメニューを閉じる: メニュー項目クリック (= 各 data-action ハンドラが
      // 自身の責務でメニュー状態をリセットする) かトリガー以外は全て閉じる。
      // メニュー外側 + メニュー内パディング両方を拾うため、`closest('.doc-item__menu')`
      // ではなく具体的なアクション名で判定する。
      const isMenuTrigger = action === 'toggle-item-menu' || action === 'toggle-filter';
      const isMenuChoice =
        action === 'archive' ||
        action === 'unarchive' ||
        action === 'delete' ||
        action === 'set-filter';
      if (!isMenuTrigger && !isMenuChoice) {
        closeAllMenus(root);
      }

      if (!action) return;
      const idAttr = actionEl?.dataset.id ?? target.closest<HTMLElement>('[data-id]')?.dataset.id;
      const id = idAttr ? Number(idAttr) : null;

      if (action === 'toggle-item-menu' && id !== null) {
        e.stopPropagation();
        const li = root.querySelector<HTMLElement>(`.doc-item[data-id="${id}"]`);
        const menu = li?.querySelector<HTMLElement>('.doc-item__menu');
        const btn = li?.querySelector<HTMLButtonElement>('.doc__menu-btn');
        if (menu) {
          const willOpen = menu.hasAttribute('hidden');
          closeAllMenus(root);
          if (willOpen) {
            menu.removeAttribute('hidden');
            btn?.setAttribute('aria-expanded', 'true');
          }
        }
      } else if (action === 'toggle-filter') {
        e.stopPropagation();
        const menu = root.querySelector<HTMLElement>('.docs__filter-menu');
        const btn = root.querySelector<HTMLButtonElement>('.docs__filter-toggle');
        if (menu) {
          const willOpen = menu.hasAttribute('hidden');
          closeAllMenus(root);
          if (willOpen) {
            menu.removeAttribute('hidden');
            btn?.setAttribute('aria-expanded', 'true');
          }
        }
      } else if (action === 'set-filter') {
        const f = actionEl?.dataset.filter as FilterMode | undefined;
        if (!f || f === filterMode) {
          closeAllMenus(root);
          return;
        }
        filterMode = f;
        await renderLibrary(root);
      } else if (action === 'open' && id !== null) {
        navigate(`?doc=${id}`);
      } else if (action === 'toggle-star' && id !== null) {
        const doc = cachedDocs.find((d) => d.id === id);
        const next = !doc?.starred;
        await setStarred(id, next);
        if (doc) doc.starred = next;
        const li = root.querySelector<HTMLElement>(`.doc-item[data-id="${id}"]`);
        const card = li?.querySelector<HTMLElement>('.doc, .bm-card');
        const btn = li?.querySelector<HTMLButtonElement>('.doc__star');
        if (li && btn) {
          card?.classList.toggle('doc--starred', next);
          card?.classList.toggle('bm-card--starred', next);
          btn.setAttribute('aria-pressed', String(next));
          btn.setAttribute('aria-label', next ? t('doc.star.remove') : t('doc.star.add'));
          btn.innerHTML = starIcon(next);
        }
        if (filterMode === 'starred' && !next) {
          await renderLibrary(root);
        }
      } else if (action === 'archive' && id !== null) {
        await setArchived(id, true);
        await renderLibrary(root);
      } else if (action === 'unarchive' && id !== null) {
        await setArchived(id, false);
        await renderLibrary(root);
      } else if (action === 'delete' && id !== null) {
        if (confirm(t('doc.deleteConfirm'))) {
          await deleteDocument(id);
          await renderLibrary(root);
        }
      } else if (action === 'add-pasted') {
        const textarea = root.querySelector<HTMLTextAreaElement>('#paste-area');
        const titleInput = root.querySelector<HTMLInputElement>('#paste-title');
        const text = textarea?.value.trim() ?? '';
        if (!text) return;
        const filename = (titleInput?.value.trim() || 'pasted') + '.txt';
        const newId = await importRawText(text, filename);
        navigate(`?doc=${newId}`);
      } else if (action === 'open-settings') {
        navigate('?view=settings');
      } else if (action === 'toggle-search') {
        searchOpen = !searchOpen;
        if (!searchOpen) {
          searchQuery = '';
        }
        await renderLibrary(root);
        if (searchOpen) {
          root.querySelector<HTMLInputElement>('#search-input')?.focus();
        }
      } else if (action === 'clear-search') {
        searchQuery = '';
        await renderLibrary(root);
        root.querySelector<HTMLInputElement>('#search-input')?.focus();
      }
    },
    { signal },
  );

  root.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') {
        const hadMenu = !!root.querySelector(
          '.doc-item__menu:not([hidden]), .docs__filter-menu:not([hidden])',
        );
        if (hadMenu) {
          closeAllMenus(root);
          e.stopPropagation();
        }
      }
    },
    { signal },
  );

  const searchInput = root.querySelector<HTMLInputElement>('#search-input');
  searchInput?.addEventListener(
    'input',
    () => {
      searchQuery = searchInput.value;
      updateFilteredList(root);
    },
    { signal },
  );
  searchInput?.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') {
        searchQuery = '';
        searchOpen = false;
        renderLibrary(root);
      }
    },
    { signal },
  );
}

function updateFilteredList(root: HTMLElement) {
  const section = root.querySelector<HTMLElement>('.docs');
  if (!section) return;
  const clearBtn = section.querySelector<HTMLButtonElement>('.docs__search-clear');
  if (clearBtn) clearBtn.hidden = !searchQuery;

  section.querySelector('.docs__list')?.remove();
  section.querySelector('.docs__empty')?.remove();

  const visible = applyFilters(cachedDocs);
  const bookmarkItems = filterMode === 'bookmarked' ? collectBookmarkItems(visible) : [];
  const count = filterMode === 'bookmarked' ? bookmarkItems.length : visible.length;
  const html = renderListSection(cachedDocs, visible, bookmarkItems);
  const countEl = section.querySelector<HTMLElement>('.docs__count');
  if (countEl) countEl.textContent = String(count);
  section.insertAdjacentHTML('beforeend', html);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
