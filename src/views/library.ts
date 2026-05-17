import { deleteDocument, listDocuments, getStorageEstimate, type DocRecord } from '../lib/db';
import { importFiles, importRawText } from '../lib/import';
import { navigate } from '../router';

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString('ja-JP', {
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

export async function renderLibrary(root: HTMLElement): Promise<void> {
  const docs = await listDocuments();
  const estimate = await getStorageEstimate();

  root.innerHTML = `
    <header class="topbar">
      <h1 class="topbar__title">Text Reader</h1>
      <div class="topbar__actions">
        <button class="btn btn--ghost" data-action="open-settings" aria-label="設定">⚙</button>
      </div>
    </header>
    <main class="library">
      <section class="upload" aria-label="ファイル取り込み">
        <label class="upload__drop" id="drop-zone">
          <input type="file" id="file-input" accept=".txt,.md,.markdown,text/plain,text/markdown" multiple hidden />
          <div class="upload__icon" aria-hidden="true">＋</div>
          <div class="upload__primary">タップ または ドラッグして追加</div>
          <div class="upload__hint">.txt / .md をアップロード</div>
        </label>
        <details class="upload__paste">
          <summary>テキストを直接貼り付け</summary>
          <textarea id="paste-area" rows="6" placeholder="ここに本文を貼り付け…"></textarea>
          <div class="upload__paste-actions">
            <input type="text" id="paste-title" placeholder="タイトル（任意）" />
            <button class="btn btn--primary" data-action="add-pasted">追加</button>
          </div>
        </details>
      </section>

      <section class="docs" aria-label="ライブラリ">
        <h2 class="docs__heading">ライブラリ <span class="docs__count">${docs.length}</span></h2>
        ${docs.length === 0
          ? `<p class="docs__empty">まだドキュメントがありません。txt / md ファイルを追加してください。</p>`
          : `<ul class="docs__list">${docs.map(renderItem).join('')}</ul>`}
      </section>

      ${renderStorageInfo(estimate)}
    </main>
  `;

  attachLibraryEvents(root);
}

function renderItem(d: DocRecord): string {
  return `
    <li class="doc" data-id="${d.id}">
      <button class="doc__open" data-action="open" data-id="${d.id}">
        <div class="doc__title">${escapeHtml(d.title)}</div>
        <div class="doc__meta">
          <span class="doc__format">${d.format.toUpperCase()}</span>
          <span class="doc__size">${fmtSize(d.byteSize)}</span>
          <span class="doc__date">${fmtDate(d.updatedAt)}</span>
        </div>
      </button>
      <button class="doc__delete" data-action="delete" data-id="${d.id}" aria-label="削除">✕</button>
    </li>
  `;
}

function renderStorageInfo(estimate: StorageEstimate | null): string {
  if (!estimate || !estimate.quota) return '';
  const usedMB = ((estimate.usage ?? 0) / 1024 / 1024).toFixed(2);
  const quotaMB = (estimate.quota / 1024 / 1024).toFixed(0);
  const pct = estimate.quota
    ? Math.min(100, ((estimate.usage ?? 0) / estimate.quota) * 100)
    : 0;
  return `
    <section class="storage" aria-label="ストレージ使用状況">
      <div class="storage__label">ストレージ ${usedMB} MB / ${quotaMB} MB</div>
      <div class="storage__bar" role="progressbar" aria-valuenow="${pct.toFixed(0)}" aria-valuemin="0" aria-valuemax="100">
        <div class="storage__fill" style="width:${pct.toFixed(2)}%"></div>
      </div>
    </section>
  `;
}

function attachLibraryEvents(root: HTMLElement) {
  const fileInput = root.querySelector<HTMLInputElement>('#file-input');
  const dropZone = root.querySelector<HTMLLabelElement>('#drop-zone');

  fileInput?.addEventListener('change', async () => {
    if (!fileInput.files) return;
    const ids = await importFiles(fileInput.files);
    if (ids.length === 1) {
      navigate(`?doc=${ids[0]}`);
    } else {
      navigate('');
    }
  });

  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('upload__drop--over');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('upload__drop--over');
    });
    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('upload__drop--over');
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      const ids = await importFiles(files);
      if (ids.length === 1) navigate(`?doc=${ids[0]}`);
      else navigate('');
    });
  }

  root.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const action = target.closest<HTMLElement>('[data-action]')?.dataset.action;
    if (!action) return;
    const idAttr = target.closest<HTMLElement>('[data-id]')?.dataset.id;
    const id = idAttr ? Number(idAttr) : null;

    if (action === 'open' && id !== null) {
      navigate(`?doc=${id}`);
    } else if (action === 'delete' && id !== null) {
      if (confirm('このドキュメントを削除します。よろしいですか？')) {
        await deleteDocument(id);
        navigate('');
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
