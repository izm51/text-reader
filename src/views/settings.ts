import {
  applyReadingPrefs,
  applyTheme,
  getReadingPrefs,
  getTheme,
  setReadingPrefs,
  type Theme,
} from '../lib/theme';
import { navigate } from '../router';

export function renderSettings(root: HTMLElement): void {
  const theme = getTheme();
  const prefs = getReadingPrefs();

  root.innerHTML = `
    <header class="topbar">
      <button class="btn btn--ghost btn--icon" data-action="back" aria-label="ライブラリへ戻る"><svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg></button>
      <h1 class="topbar__title">設定</h1>
    </header>

    <main class="settings">
      <section class="settings__group">
        <h2>テーマ</h2>
        <div class="settings__row">
          <label><input type="radio" name="theme" value="system" ${theme === 'system' ? 'checked' : ''} /> 端末に合わせる</label>
          <label><input type="radio" name="theme" value="light" ${theme === 'light' ? 'checked' : ''} /> ライト</label>
          <label><input type="radio" name="theme" value="dark" ${theme === 'dark' ? 'checked' : ''} /> ダーク</label>
        </div>
      </section>

      <section class="settings__group">
        <h2>本文表示</h2>
        <label class="settings__slider">
          フォントサイズ <span id="fs-val">${prefs.fontSize}px</span>
          <input type="range" id="fs" min="14" max="28" step="1" value="${prefs.fontSize}" />
        </label>
        <label class="settings__slider">
          行間 <span id="lh-val">${prefs.lineHeight.toFixed(2)}</span>
          <input type="range" id="lh" min="1.4" max="2.4" step="0.05" value="${prefs.lineHeight}" />
        </label>
        <label class="settings__slider">
          最大幅 <span id="mw-val">${prefs.maxWidth}px</span>
          <input type="range" id="mw" min="480" max="960" step="20" value="${prefs.maxWidth}" />
        </label>
      </section>

      <section class="settings__group">
        <h2>使い方</h2>
        <ul class="settings__notes">
          <li>ホーム画面に追加すると、他アプリの共有メニューから txt / md を直接取り込めます。</li>
          <li>ファイルはブラウザの IndexedDB に保存されます (永続化を要求しますが、長期未使用や端末側クリーンアップで消える可能性があります)。</li>
        </ul>
      </section>
    </main>
  `;

  root.addEventListener('click', (e) => {
    const action = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;
    if (action === 'back') {
      navigate('');
    }
  });

  root.querySelectorAll<HTMLInputElement>('input[name="theme"]').forEach((el) => {
    el.addEventListener('change', () => {
      applyTheme(el.value as Theme);
    });
  });

  const fs = root.querySelector<HTMLInputElement>('#fs')!;
  const lh = root.querySelector<HTMLInputElement>('#lh')!;
  const mw = root.querySelector<HTMLInputElement>('#mw')!;
  const fsVal = root.querySelector<HTMLElement>('#fs-val')!;
  const lhVal = root.querySelector<HTMLElement>('#lh-val')!;
  const mwVal = root.querySelector<HTMLElement>('#mw-val')!;

  const update = () => {
    const p = {
      fontSize: Number(fs.value),
      lineHeight: Number(lh.value),
      maxWidth: Number(mw.value),
    };
    fsVal.textContent = `${p.fontSize}px`;
    lhVal.textContent = p.lineHeight.toFixed(2);
    mwVal.textContent = `${p.maxWidth}px`;
    setReadingPrefs(p);
    applyReadingPrefs(p);
  };
  fs.addEventListener('input', update);
  lh.addEventListener('input', update);
  mw.addEventListener('input', update);
}
