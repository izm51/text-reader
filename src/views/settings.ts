import {
  applyReadingPrefs,
  applyTheme,
  DEFAULT_READING,
  getReadingPrefs,
  getTheme,
  setReadingPrefs,
  type Theme,
} from '../lib/theme';
import { getLangPref, setLangPref, t, type LangPref } from '../lib/i18n';
import { navigate } from '../router';

export function renderSettings(root: HTMLElement): void {
  const theme = getTheme();
  const prefs = getReadingPrefs();
  const lang = getLangPref();

  root.innerHTML = `
    <header class="topbar">
      <button class="btn btn--ghost btn--icon" data-action="back" aria-label="${t('common.back')}"><svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg></button>
      <h1 class="topbar__title">${t('settings.title')}</h1>
    </header>

    <main class="settings">
      <section class="settings__group">
        <h2>${t('settings.theme')}</h2>
        <div class="settings__row">
          <label><input type="radio" name="theme" value="system" ${theme === 'system' ? 'checked' : ''} /> ${t('settings.theme.system')}</label>
          <label><input type="radio" name="theme" value="light" ${theme === 'light' ? 'checked' : ''} /> ${t('settings.theme.light')}</label>
          <label><input type="radio" name="theme" value="dark" ${theme === 'dark' ? 'checked' : ''} /> ${t('settings.theme.dark')}</label>
        </div>
      </section>

      <section class="settings__group">
        <h2>${t('settings.language')}</h2>
        <div class="settings__row">
          <label><input type="radio" name="lang" value="system" ${lang === 'system' ? 'checked' : ''} /> ${t('settings.language.system')}</label>
          <label><input type="radio" name="lang" value="ja" ${lang === 'ja' ? 'checked' : ''} /> 日本語</label>
          <label><input type="radio" name="lang" value="en" ${lang === 'en' ? 'checked' : ''} /> English</label>
        </div>
      </section>

      <section class="settings__group">
        <h2>${t('settings.reading')}</h2>
        <label class="settings__slider">
          ${t('settings.fontSize')} <span id="fs-val">${prefs.fontSize}px</span>
          <input type="range" id="fs" min="14" max="28" step="1" value="${prefs.fontSize}" />
        </label>
        <label class="settings__slider">
          ${t('settings.lineHeight')} <span id="lh-val">${prefs.lineHeight.toFixed(2)}</span>
          <input type="range" id="lh" min="1.4" max="2.4" step="0.05" value="${prefs.lineHeight}" />
        </label>
        <label class="settings__slider settings__slider--wide-only">
          ${t('settings.maxWidth')} <span id="mw-val">${prefs.maxWidth}px</span>
          <input type="range" id="mw" min="480" max="960" step="20" value="${prefs.maxWidth}" />
        </label>
        <div class="settings__actions">
          <button class="btn" type="button" data-action="reset-reading">${t('settings.reset')}</button>
        </div>
      </section>

      <section class="settings__group">
        <h2>${t('settings.usage')}</h2>
        <ul class="settings__notes">
          <li>${t('settings.usage.share')}</li>
          <li>${t('settings.usage.storage')}</li>
        </ul>
      </section>
    </main>
  `;

  root.querySelectorAll<HTMLInputElement>('input[name="theme"]').forEach((el) => {
    el.addEventListener('change', () => {
      applyTheme(el.value as Theme);
    });
  });

  root.querySelectorAll<HTMLInputElement>('input[name="lang"]').forEach((el) => {
    el.addEventListener('change', () => {
      setLangPref(el.value as LangPref);
      renderSettings(root);
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

  const backBtn = root.querySelector<HTMLButtonElement>('[data-action="back"]');
  backBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (history.length > 1) history.back();
    else navigate('');
  });

  root.addEventListener('click', (e) => {
    const action = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;
    if (action === 'reset-reading') {
      fs.value = String(DEFAULT_READING.fontSize);
      lh.value = String(DEFAULT_READING.lineHeight);
      mw.value = String(DEFAULT_READING.maxWidth);
      update();
    }
  });
}
