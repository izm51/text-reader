import { getDocument, setBookmarks, setStarred, updateDocument } from '../lib/db';
import type { BookmarkEntry, DocRecord } from '../lib/db';
import { setArticleMeta } from '../lib/meta';
import { renderToHtml } from '../lib/parser';
import { getTTS } from '../lib/tts';
import { navigate } from '../router';

const TTS_BLOCK_SELECTOR = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, pre';

export async function renderReader(root: HTMLElement, id: number): Promise<void> {
  const doc = await getDocument(id);
  if (!doc) {
    root.innerHTML = `
      <header class="topbar">
        <button class="btn btn--ghost btn--icon" data-action="back" aria-label="ライブラリへ戻る"><svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg></button>
        <h1 class="topbar__title">見つかりません</h1>
      </header>
      <main class="reader-missing">
        <p>ID ${id} のドキュメントが見つかりませんでした。</p>
      </main>
    `;
    bindBack(root);
    return;
  }

  const html = renderToHtml(doc.format, doc.content);
  setArticleMeta(doc.title);

  root.innerHTML = `
    <header class="topbar">
      <button class="btn btn--ghost btn--icon" data-action="back" aria-label="ライブラリへ戻る"><svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg></button>
      <h1 class="topbar__title topbar__title--small">${escapeHtml(doc.title)}</h1>
      <div class="topbar__actions">
        <button class="btn btn--ghost btn--icon topbar__star${doc.starred ? ' topbar__star--on' : ''}" data-action="toggle-star" aria-label="${doc.starred ? 'スターを外す' : 'スターを付ける'}" aria-pressed="${!!doc.starred}"><svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="${doc.starred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>
        <button class="btn btn--ghost btn--icon" data-action="toggle-settings" aria-label="設定"><svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
      </div>
    </header>

    <main class="reader">
      <article class="article" itemscope itemtype="https://schema.org/Article">
        <h1 class="article__title" contenteditable="true" spellcheck="false" role="textbox" aria-label="タイトル (編集可能)">${escapeHtml(doc.title)}</h1>
        <div class="article__body">${html}</div>
      </article>
    </main>

    <aside class="player" aria-label="読み上げプレイヤー">
      <div class="player__row">
        <button class="player__btn" data-action="play" aria-label="再生"><svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button>
        <button class="player__btn" data-action="pause" aria-label="一時停止" hidden><svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg></button>
        <button class="player__btn" data-action="resume" aria-label="再開" hidden><svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button>
        <button class="player__btn" data-action="stop" aria-label="停止"><svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1"/></svg></button>
        <label class="player__rate">
          速度
          <input type="range" id="rate" min="0.5" max="2.0" step="0.1" />
          <span id="rate-val"></span>
        </label>
        <label class="player__voice-label">
          音声:
          <select id="voice" class="player__voice" aria-label="音声"></select>
        </label>
      </div>
      <div class="player__status" id="player-status" aria-live="polite"></div>
    </aside>
  `;

  bindBack(root);
  bindTitleEdit(root, doc.id!, doc.title);
  bindStarToggle(root, doc.id!, !!doc.starred);
  bindReaderEvents(root, doc);
}

function bindStarToggle(root: HTMLElement, id: number, initial: boolean) {
  const btn = root.querySelector<HTMLButtonElement>('.topbar__star');
  if (!btn) return;
  let starred = initial;
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    starred = !starred;
    await setStarred(id, starred);
    btn.classList.toggle('topbar__star--on', starred);
    btn.setAttribute('aria-pressed', String(starred));
    btn.setAttribute('aria-label', starred ? 'スターを外す' : 'スターを付ける');
    const svg = btn.querySelector('svg');
    if (svg) svg.setAttribute('fill', starred ? 'currentColor' : 'none');
  });
}

function bindTitleEdit(root: HTMLElement, id: number, initialTitle: string) {
  const titleEl = root.querySelector<HTMLElement>('.article__title');
  const topbarTitle = root.querySelector<HTMLElement>('.topbar__title');
  if (!titleEl) return;

  let savedTitle = initialTitle;

  titleEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      titleEl.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      titleEl.textContent = savedTitle;
      titleEl.blur();
    }
  });

  titleEl.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData?.getData('text/plain') ?? '').replace(/[\r\n]+/g, ' ');
    document.execCommand('insertText', false, text);
  });

  titleEl.addEventListener('blur', async () => {
    const next = (titleEl.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!next) {
      titleEl.textContent = savedTitle;
      return;
    }
    if (next === savedTitle) {
      titleEl.textContent = savedTitle;
      return;
    }
    titleEl.textContent = next;
    savedTitle = next;
    if (topbarTitle) topbarTitle.textContent = next;
    setArticleMeta(next);
    await updateDocument(id, { title: next });
  });
}

function bindBack(root: HTMLElement) {
  root.addEventListener('click', (e) => {
    const action = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;
    if (action === 'back') {
      navigate('');
    }
  });
}

const BOOKMARK_SVG_OUTLINE = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
const BOOKMARK_SVG_FILLED = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
const COPY_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const CHECK_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;

let blockActionsAbort: AbortController | null = null;

function getBlockCopyText(block: HTMLElement): string {
  const clone = block.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.block-actions').forEach((n) => n.remove());
  clone.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  return (clone.textContent ?? '').replace(/[ \t]+\n/g, '\n').trim();
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through to fallback */
    }
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function bindBlockActions(
  article: HTMLElement,
  blocks: HTMLElement[],
  doc: DocRecord,
) {
  blockActionsAbort?.abort();
  const ac = new AbortController();
  blockActionsAbort = ac;
  const { signal } = ac;

  // index -> BookmarkEntry の Map。addedAt を保持したいので Set ではなく Map。
  const bookmarks = new Map<number, BookmarkEntry>();
  for (const b of doc.bookmarks ?? []) bookmarks.set(b.index, b);
  const docId = doc.id!;

  blocks.forEach((block, idx) => {
    // <pre> は overflow-x:auto で横スクロールするためアクションが追従して
    // 見切れるので、しおり / コピー UI は対象外にする。
    if (block.tagName === 'PRE') return;
    const isBookmarked = bookmarks.has(idx);
    if (isBookmarked) block.classList.add('is-bookmarked');
    const actions = document.createElement('div');
    actions.className = 'block-actions';
    actions.contentEditable = 'false';
    // テンプレートリテラルのインデントを入れない (white-space: pre を継承する祖先で
    // 余分なテキストノードとして可視化されるのを避ける)
    actions.innerHTML =
      `<button type="button" class="block-actions__btn block-actions__btn--copy" data-paragraph-action="copy" aria-label="段落をコピー">${COPY_SVG}</button>` +
      `<button type="button" class="block-actions__btn block-actions__btn--bookmark" data-paragraph-action="bookmark" aria-label="${isBookmarked ? 'しおりを外す' : 'しおりを付ける'}" aria-pressed="${isBookmarked}">${isBookmarked ? BOOKMARK_SVG_FILLED : BOOKMARK_SVG_OUTLINE}</button>`;
    block.appendChild(actions);
  });

  function hideAllActions() {
    // タッチでボタンに乗ったフォーカスは残り続け、次の操作を阻害するので明示的に外す。
    const active = document.activeElement as HTMLElement | null;
    if (active?.closest('.block-actions')) active.blur();
    article
      .querySelectorAll<HTMLElement>('[data-tts-index].is-actions-visible')
      .forEach((el) => el.classList.remove('is-actions-visible'));
  }

  let lpTimer: number | null = null;
  let lpBlock: HTMLElement | null = null;
  let lpPointerId: number | null = null;
  let lpStartX = 0;
  let lpStartY = 0;
  // pointercancel ではタイマーを止めない（テキスト選択が pointercancel を投げても
  // メニューを確実に出すため）。その場合に指が既に離れているかをこのフラグで持つ。
  let lpEnded = false;

  // 長押しがトリガーした後、合成 click を抑止するため block + 時刻を覚えておく。
  // 時刻ベースなのでフラグが残りっぱなしになって次のタップを食う事故が起きない。
  let firedBlock: HTMLElement | null = null;
  let firedReleasedAt = 0;

  function clearLP() {
    if (lpTimer !== null) {
      clearTimeout(lpTimer);
      lpTimer = null;
    }
    lpBlock = null;
    lpPointerId = null;
  }

  article.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType !== 'touch') return;
      const target = e.target as HTMLElement;
      if (target.closest('.block-actions')) return;
      if (target.closest('a[href]')) return;
      const block = target.closest<HTMLElement>('[data-tts-index]');
      if (!block) return;
      if (block.tagName === 'PRE') return;
      clearLP();
      lpBlock = block;
      lpPointerId = e.pointerId;
      lpStartX = e.clientX;
      lpStartY = e.clientY;
      lpEnded = false;
      lpTimer = window.setTimeout(() => {
        lpTimer = null;
        if (!lpBlock) return;
        const fired = lpBlock;
        hideAllActions();
        fired.classList.add('is-actions-visible');
        firedBlock = fired;
        // pointercancel 後に発火した場合は指が既に離れているので、抑止が
        // 残り続けないよう解放時刻を今にしておく。
        firedReleasedAt = lpEnded ? Date.now() : 0;
        try {
          navigator.vibrate?.(15);
        } catch {
          /* ignore */
        }
        lpBlock = null;
      }, 300);
    },
    { signal },
  );

  article.addEventListener(
    'pointermove',
    (e) => {
      if (lpPointerId === null || e.pointerId !== lpPointerId) return;
      if (Math.hypot(e.clientX - lpStartX, e.clientY - lpStartY) > 10) {
        clearLP();
      }
    },
    { signal },
  );

  // pointerup（=タップで指を離した）はタイマーを止める。300ms 未満の素早いタップで
  // メニューが出ないようにするため。
  article.addEventListener(
    'pointerup',
    (e) => {
      if (lpPointerId !== null && e.pointerId !== lpPointerId) return;
      lpEnded = true;
      if (firedBlock && firedReleasedAt === 0) firedReleasedAt = Date.now();
      clearLP();
    },
    { signal },
  );
  // pointercancel（ネイティブのテキスト選択開始など）ではタイマーを止めず、
  // 300ms 経過でメニューを出す。スクロールは pointermove(>10px) 側で打ち切られる。
  article.addEventListener(
    'pointercancel',
    (e) => {
      if (lpPointerId !== null && e.pointerId !== lpPointerId) return;
      lpEnded = true;
      if (firedBlock && firedReleasedAt === 0) firedReleasedAt = Date.now();
    },
    { signal },
  );

  document.addEventListener(
    'pointerdown',
    (e) => {
      const target = e.target as HTMLElement;
      // メニュー上のボタンは click ハンドラ側でアクション実行後に閉じるので、
      // ここでは閉じない（閉じると pointer-events が切れて click が成立しない）。
      if (target.closest('.block-actions')) return;
      // 開いているメニューと同じ段落をタップした場合、その「閉じるためのタップ」で
      // TTS が始まらないよう合成 click を抑止してから閉じる。
      const visibleBlock = target.closest<HTMLElement>(
        '[data-tts-index].is-actions-visible',
      );
      if (visibleBlock) {
        firedBlock = visibleBlock;
        firedReleasedAt = Date.now();
      }
      hideAllActions();
    },
    { signal },
  );

  function isSuppressedClick(target: HTMLElement | null): boolean {
    if (!firedBlock || !target) return false;
    if (target !== firedBlock) return false;
    if (firedReleasedAt === 0) return true; // まだ指が離れていないが click が来た場合
    return Date.now() - firedReleasedAt < 300;
  }

  // bindReaderEvents の TTS click ハンドラから参照させるための公開
  (article as HTMLElement & { __isSuppressedLongPressClick?: typeof isSuppressedClick })
    .__isSuppressedLongPressClick = isSuppressedClick;

  article.addEventListener(
    'click',
    async (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
        '[data-paragraph-action]',
      );
      if (!btn) return;
      e.stopPropagation();
      e.preventDefault();
      // ボタン操作時は長押しで始まったネイティブのテキスト選択も解除する。
      window.getSelection()?.removeAllRanges();
      const block = btn.closest<HTMLElement>('[data-tts-index]');
      if (!block) return;
      const idx = Number(block.dataset.ttsIndex);
      if (Number.isNaN(idx)) return;
      const action = btn.dataset.paragraphAction;
      // 押したらメニューを閉じる。ただしコピー失敗時だけはエラー表示を見せるため残す。
      let closeAfter = true;
      if (action === 'bookmark') {
        const next = !bookmarks.has(idx);
        if (next) bookmarks.set(idx, { index: idx, addedAt: Date.now() });
        else bookmarks.delete(idx);
        btn.setAttribute('aria-pressed', String(next));
        btn.setAttribute('aria-label', next ? 'しおりを外す' : 'しおりを付ける');
        btn.innerHTML = next ? BOOKMARK_SVG_FILLED : BOOKMARK_SVG_OUTLINE;
        block.classList.toggle('is-bookmarked', next);
        try {
          const list = [...bookmarks.values()].sort((a, b) => a.index - b.index);
          await setBookmarks(docId, list);
        } catch (err) {
          console.error('failed to persist bookmarks', err);
        }
      } else if (action === 'copy') {
        const text = getBlockCopyText(block);
        const ok = await copyToClipboard(text);
        const prev = btn.dataset.copyTimerId;
        if (prev) {
          clearTimeout(Number(prev));
          delete btn.dataset.copyTimerId;
        }
        if (ok) {
          btn.classList.remove('block-actions__btn--copy-failed');
          btn.classList.add('block-actions__btn--copied');
          btn.innerHTML = CHECK_SVG;
        } else {
          btn.classList.remove('block-actions__btn--copied');
          btn.classList.add('block-actions__btn--copy-failed');
          btn.setAttribute('aria-label', 'コピーに失敗');
          closeAfter = false;
        }
        const timer = window.setTimeout(() => {
          btn.classList.remove('block-actions__btn--copied');
          btn.classList.remove('block-actions__btn--copy-failed');
          btn.innerHTML = COPY_SVG;
          btn.setAttribute('aria-label', '段落をコピー');
          delete btn.dataset.copyTimerId;
        }, 1100);
        btn.dataset.copyTimerId = String(timer);
      }
      if (closeAfter) {
        // 成功フィードバック（✓ / しおり）が一瞬見えるよう少し置いてから閉じる。
        window.setTimeout(() => {
          if (!signal.aborted) hideAllActions();
        }, 450);
      }
    },
    { signal },
  );
}

function tagBlocks(article: HTMLElement): { blocks: HTMLElement[]; chunks: string[] } {
  const blocks: HTMLElement[] = [];
  const chunks: string[] = [];
  const candidates = article.querySelectorAll<HTMLElement>(TTS_BLOCK_SELECTOR);
  candidates.forEach((el) => {
    if (el.closest('pre') && el.tagName !== 'PRE') return;
    if (el.tagName === 'LI' && el.querySelector('ul, ol')) return;
    const text = (el.textContent || '').trim();
    if (!text) return;
    const idx = blocks.length;
    el.setAttribute('data-tts-index', String(idx));
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    blocks.push(el);
    chunks.push(text);
  });
  return { blocks, chunks };
}

function bindReaderEvents(root: HTMLElement, doc: DocRecord) {
  const controller = getTTS();
  const article = root.querySelector('.article__body') as HTMLElement;
  const rate = root.querySelector<HTMLInputElement>('#rate')!;
  const rateVal = root.querySelector<HTMLSpanElement>('#rate-val')!;
  const voiceSel = root.querySelector<HTMLSelectElement>('#voice')!;
  const statusEl = root.querySelector<HTMLElement>('#player-status')!;
  const playBtn = root.querySelector<HTMLButtonElement>('[data-action="play"]')!;
  const pauseBtn = root.querySelector<HTMLButtonElement>('[data-action="pause"]')!;
  const resumeBtn = root.querySelector<HTMLButtonElement>('[data-action="resume"]')!;

  const { blocks, chunks } = tagBlocks(article);
  bindBlockActions(article, blocks, doc);

  rate.value = String(controller.currentState.rate);
  rateVal.textContent = `${controller.currentState.rate.toFixed(1)}x`;

  function refreshVoices() {
    const voices = controller.getVoices();
    const current = controller.currentState.voiceURI;
    const jaFirst = [
      ...voices.filter((v) => v.lang.startsWith('ja')),
      ...voices.filter((v) => !v.lang.startsWith('ja')),
    ];
    voiceSel.innerHTML =
      `<option value="">自動 (端末既定)</option>` +
      jaFirst
        .map(
          (v) =>
            `<option value="${escapeHtml(v.voiceURI)}" ${v.voiceURI === current ? 'selected' : ''}>${escapeHtml(v.name)} (${v.lang})</option>`,
        )
        .join('');
  }
  refreshVoices();
  // bindBlockActions が作った AbortController に相乗りして、レンダー毎に
  // voiceschanged リスナーが累積するのを防ぐ。
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.addEventListener?.('voiceschanged', refreshVoices, {
      signal: blockActionsAbort?.signal,
    } as AddEventListenerOptions);
  }

  let lastActive: HTMLElement | null = null;
  function setActive(idx: number, visible: boolean) {
    if (lastActive) lastActive.classList.remove('tts-active');
    if (!visible) {
      lastActive = null;
      return;
    }
    const el = blocks[idx];
    if (!el) {
      lastActive = null;
      return;
    }
    el.classList.add('tts-active');
    lastActive = el;
    const rect = el.getBoundingClientRect();
    const outOfView = rect.top < 60 || rect.bottom > window.innerHeight - 120;
    if (outOfView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  controller.subscribe((s) => {
    statusEl.textContent =
      s.status === 'playing'
        ? `再生中… (${s.cursor + 1}/${s.total})`
        : s.status === 'paused'
          ? `一時停止 (${s.cursor + 1}/${s.total})`
          : '';
    playBtn.hidden = s.status !== 'idle';
    pauseBtn.hidden = s.status !== 'playing';
    resumeBtn.hidden = s.status !== 'paused';
    setActive(s.cursor, s.status !== 'idle');
  });

  rate.addEventListener('input', () => {
    const v = Number(rate.value);
    controller.setRate(v);
    rateVal.textContent = `${v.toFixed(1)}x`;
  });

  voiceSel.addEventListener('change', () => {
    controller.setVoice(voiceSel.value || null);
  });

  const isSuppressedLongPressClick = (
    article as HTMLElement & { __isSuppressedLongPressClick?: (t: HTMLElement | null) => boolean }
  ).__isSuppressedLongPressClick;

  article.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
    if (link) {
      handleArticleLinkClick(article, link, e);
      return;
    }
    if ((e.target as HTMLElement).closest('.block-actions')) return;
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-tts-index]');
    if (!target) return;
    if (isSuppressedLongPressClick?.(target)) return;
    const idx = Number(target.dataset.ttsIndex);
    if (Number.isNaN(idx)) return;
    controller.speak(chunks, idx);
  });

  article.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if ((e.target as HTMLElement).closest('a[href]')) return;
    if ((e.target as HTMLElement).closest('.block-actions')) return;
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-tts-index]');
    if (!target) return;
    e.preventDefault();
    if (isSuppressedLongPressClick?.(target)) return;
    const idx = Number(target.dataset.ttsIndex);
    if (Number.isNaN(idx)) return;
    controller.speak(chunks, idx);
  });

  root.addEventListener('click', (e) => {
    const action = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;
    if (action === 'play') {
      const startAt =
        controller.currentState.status === 'idle' ? 0 : controller.currentState.cursor;
      controller.speak(chunks, startAt);
    } else if (action === 'pause') {
      controller.pause();
    } else if (action === 'resume') {
      controller.resume();
    } else if (action === 'stop') {
      controller.stop();
    } else if (action === 'toggle-settings') {
      navigate('?view=settings');
    }
  });
}

function handleArticleLinkClick(
  article: HTMLElement,
  link: HTMLAnchorElement,
  e: MouseEvent,
): void {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const href = link.getAttribute('href') ?? '';
  if (!href.startsWith('#')) return;
  e.preventDefault();
  const id = decodeURIComponent(href.slice(1));
  if (!id) return;
  const target = article.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`);
  target?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
