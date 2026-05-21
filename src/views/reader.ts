import { getDocument, setStarred, updateDocument } from '../lib/db';
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
  bindReaderEvents(root, doc.id!, doc.savedParagraphs ?? []);
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

function bindReaderEvents(root: HTMLElement, id: number, initialSaved: string[]) {
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
  bindParagraphLongPress(article, chunks, initialSaved, id);
  scrollToTargetParagraph(blocks, chunks);

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
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
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

  article.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
    if (link) {
      handleArticleLinkClick(article, link, e);
      return;
    }
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-tts-index]');
    if (!target) return;
    const idx = Number(target.dataset.ttsIndex);
    if (Number.isNaN(idx)) return;
    controller.speak(chunks, idx);
  });

  article.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if ((e.target as HTMLElement).closest('a[href]')) return;
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-tts-index]');
    if (!target) return;
    e.preventDefault();
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

const TARGET_PARAGRAPH_KEY = 'text-reader:target-paragraph';

function scrollToTargetParagraph(blocks: HTMLElement[], chunks: string[]): void {
  const target = sessionStorage.getItem(TARGET_PARAGRAPH_KEY);
  if (!target) return;
  sessionStorage.removeItem(TARGET_PARAGRAPH_KEY);
  const idx = chunks.indexOf(target);
  if (idx < 0) return;
  const el = blocks[idx];
  if (!el) return;
  requestAnimationFrame(() => {
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.add('paragraph-flash');
    window.setTimeout(() => el.classList.remove('paragraph-flash'), 1800);
  });
}

const SAVE_ICON_FILLED = `<svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
const SAVE_ICON_OUTLINE = `<svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
const COPY_ICON = `<svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

function bindParagraphLongPress(
  article: HTMLElement,
  chunks: string[],
  initialSaved: string[],
  docId: number,
): void {
  const LONG_PRESS_MS = 500;
  const MOVE_THRESHOLD = 10;

  const saved = new Set(initialSaved);
  let timer: number | null = null;
  let startX = 0;
  let startY = 0;
  let suppressNextClick = false;
  let currentMenu: HTMLElement | null = null;

  const clearTimer = (): void => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  };

  const closeMenu = (): void => {
    if (currentMenu) {
      currentMenu.remove();
      currentMenu = null;
    }
  };

  const persistSaved = async (): Promise<void> => {
    await updateDocument(docId, { savedParagraphs: Array.from(saved) });
  };

  const showMenu = (target: HTMLElement, text: string): void => {
    closeMenu();
    const isSaved = saved.has(text);
    const menu = document.createElement('div');
    menu.className = 'para-menu';
    menu.setAttribute('role', 'toolbar');
    menu.setAttribute('aria-label', '段落メニュー');
    menu.innerHTML = `
      <button type="button" class="para-menu__btn${isSaved ? ' para-menu__btn--active' : ''}" data-para-action="save" aria-label="${isSaved ? '保存を解除' : '保存'}" aria-pressed="${isSaved}">${isSaved ? SAVE_ICON_FILLED : SAVE_ICON_OUTLINE}</button>
      <button type="button" class="para-menu__btn" data-para-action="copy" aria-label="コピー">${COPY_ICON}</button>
    `;
    menu.style.top = `${target.offsetTop + target.offsetHeight + 4}px`;
    article.appendChild(menu);
    currentMenu = menu;

    menu.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
    });

    menu.addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-para-action]');
      if (!btn) return;
      const action = btn.dataset.paraAction;
      if (action === 'copy') {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          /* ignore */
        }
        closeMenu();
      } else if (action === 'save') {
        if (saved.has(text)) saved.delete(text);
        else saved.add(text);
        await persistSaved();
        closeMenu();
      }
    });
  };

  article.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('.para-menu')) return;
    suppressNextClick = false;
    if ((e.target as HTMLElement).closest('a[href]')) return;
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-tts-index]');
    if (!target) return;
    const idx = Number(target.dataset.ttsIndex);
    if (Number.isNaN(idx)) return;
    startX = e.clientX;
    startY = e.clientY;
    clearTimer();
    timer = window.setTimeout(() => {
      timer = null;
      suppressNextClick = true;
      showMenu(target, chunks[idx]);
    }, LONG_PRESS_MS);
  });

  article.addEventListener('pointermove', (e) => {
    if (timer === null) return;
    if (
      Math.abs(e.clientX - startX) > MOVE_THRESHOLD ||
      Math.abs(e.clientY - startY) > MOVE_THRESHOLD
    ) {
      clearTimer();
    }
  });

  article.addEventListener('pointerup', clearTimer);
  article.addEventListener('pointercancel', clearTimer);
  article.addEventListener('pointerleave', clearTimer);

  article.addEventListener(
    'click',
    (e) => {
      if (!suppressNextClick) return;
      suppressNextClick = false;
      if ((e.target as HTMLElement).closest('.para-menu')) return;
      e.stopImmediatePropagation();
      e.preventDefault();
    },
    true,
  );

  document.addEventListener('pointerdown', (e) => {
    if (!currentMenu) return;
    if (currentMenu.contains(e.target as Node)) return;
    closeMenu();
  });

  window.addEventListener('resize', closeMenu);
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
