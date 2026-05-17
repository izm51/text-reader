import { getDocument } from '../lib/db';
import { extractPlainText, renderToHtml } from '../lib/parser';
import { TTSController } from '../lib/tts';
import { navigate } from '../router';

let tts: TTSController | null = null;

function getTTS(): TTSController {
  if (!tts) tts = new TTSController();
  return tts;
}

export async function renderReader(root: HTMLElement, id: number): Promise<void> {
  const doc = await getDocument(id);
  if (!doc) {
    root.innerHTML = `
      <header class="topbar">
        <button class="btn btn--ghost" data-action="back">← 戻る</button>
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

  root.innerHTML = `
    <header class="topbar">
      <button class="btn btn--ghost" data-action="back" aria-label="戻る">←</button>
      <h1 class="topbar__title topbar__title--small">${escapeHtml(doc.title)}</h1>
      <div class="topbar__actions">
        <button class="btn btn--ghost" data-action="toggle-settings" aria-label="表示設定">Aa</button>
      </div>
    </header>

    <div class="hint" id="chrome-hint" hidden></div>

    <main class="reader">
      <article class="article">
        <h1 class="article__title">${escapeHtml(doc.title)}</h1>
        <div class="article__body">${html}</div>
      </article>
    </main>

    <aside class="player" aria-label="読み上げプレイヤー">
      <div class="player__row">
        <button class="player__btn" data-action="play" aria-label="再生">▶</button>
        <button class="player__btn" data-action="pause" aria-label="一時停止" hidden>⏸</button>
        <button class="player__btn" data-action="resume" aria-label="再開" hidden>▶</button>
        <button class="player__btn" data-action="stop" aria-label="停止">■</button>
        <label class="player__rate">
          速度
          <input type="range" id="rate" min="0.5" max="2.0" step="0.1" />
          <span id="rate-val"></span>
        </label>
        <select id="voice" class="player__voice" aria-label="音声"></select>
      </div>
      <div class="player__status" id="player-status" aria-live="polite"></div>
    </aside>
  `;

  bindBack(root);
  bindReaderEvents(root, doc.id!);
  showChromeHintIfRelevant(root);
}

function bindBack(root: HTMLElement) {
  root.addEventListener('click', (e) => {
    const action = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;
    if (action === 'back') {
      if (history.length > 1) history.back();
      else navigate('');
    }
  });
}

function bindReaderEvents(root: HTMLElement, _id: number) {
  const controller = getTTS();
  const article = root.querySelector('.article__body') as HTMLElement;
  const rate = root.querySelector<HTMLInputElement>('#rate')!;
  const rateVal = root.querySelector<HTMLSpanElement>('#rate-val')!;
  const voiceSel = root.querySelector<HTMLSelectElement>('#voice')!;
  const statusEl = root.querySelector<HTMLElement>('#player-status')!;
  const playBtn = root.querySelector<HTMLButtonElement>('[data-action="play"]')!;
  const pauseBtn = root.querySelector<HTMLButtonElement>('[data-action="pause"]')!;
  const resumeBtn = root.querySelector<HTMLButtonElement>('[data-action="resume"]')!;

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

  controller.subscribe((s) => {
    statusEl.textContent =
      s.status === 'playing' ? '再生中…' : s.status === 'paused' ? '一時停止中' : '';
    playBtn.hidden = s.status !== 'idle';
    pauseBtn.hidden = s.status !== 'playing';
    resumeBtn.hidden = s.status !== 'paused';
  });

  rate.addEventListener('input', () => {
    const v = Number(rate.value);
    controller.setRate(v);
    rateVal.textContent = `${v.toFixed(1)}x`;
  });

  voiceSel.addEventListener('change', () => {
    controller.setVoice(voiceSel.value || null);
  });

  root.addEventListener('click', (e) => {
    const action = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;
    if (action === 'play') {
      const text = extractPlainText(article.innerHTML);
      controller.speak(text);
    } else if (action === 'pause') {
      controller.pause();
    } else if (action === 'resume') {
      controller.resume();
    } else if (action === 'stop') {
      controller.stop();
    } else if (action === 'toggle-settings') {
      navigate('?view=settings');
    } else if (action === 'open-in-browser') {
      window.open(location.href, '_blank', 'noopener');
    } else if (action === 'dismiss-hint') {
      const hint = root.querySelector<HTMLElement>('#chrome-hint');
      if (hint) hint.hidden = true;
      const key = hint?.dataset.dismissKey ?? 'chrome-hint-dismissed';
      localStorage.setItem(key, '1');
    }
  });
}

function isPwaDisplayMode(): boolean {
  return (
    matchMedia('(display-mode: standalone)').matches ||
    matchMedia('(display-mode: minimal-ui)').matches ||
    matchMedia('(display-mode: fullscreen)').matches ||
    // iOS Safari legacy
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function showChromeHintIfRelevant(root: HTMLElement) {
  const ua = navigator.userAgent;
  const isAndroidChrome = /Android/.test(ua) && /Chrome\//.test(ua) && !/EdgA|SamsungBrowser/.test(ua);
  if (!isAndroidChrome) return;

  const isPwa = isPwaDisplayMode();
  const dismissKey = isPwa ? 'chrome-hint-pwa-dismissed' : 'chrome-hint-dismissed';
  if (localStorage.getItem(dismissKey) === '1') return;

  const hint = root.querySelector<HTMLElement>('#chrome-hint');
  if (!hint) return;
  hint.dataset.dismissKey = dismissKey;
  hint.innerHTML = isPwa
    ? `
      <p>💡 PWA からは Chrome の ⋮ メニューが表示されません。ブラウザで開くと「このページを読み上げる」が使えます。</p>
      <div class="hint__actions">
        <button class="btn btn--primary btn--sm" data-action="open-in-browser">ブラウザで開く</button>
      </div>
      <button class="hint__close" data-action="dismiss-hint" aria-label="閉じる">✕</button>
    `
    : `
      <p>💡 高品質な読み上げは Chrome の ⋮ メニュー →「このページを読み上げる」が利用できます。</p>
      <button class="hint__close" data-action="dismiss-hint" aria-label="閉じる">✕</button>
    `;
  hint.hidden = false;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
