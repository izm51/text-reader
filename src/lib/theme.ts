export type Theme = 'system' | 'light' | 'dark';

const KEY = 'theme';

export function getTheme(): Theme {
  const v = localStorage.getItem(KEY);
  if (v === 'light' || v === 'dark' || v === 'system') return v;
  return 'system';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(KEY, theme);
}

export function initTheme(): void {
  applyTheme(getTheme());
}

export interface ReadingPrefs {
  fontSize: number;
  lineHeight: number;
  maxWidth: number;
}

const READING_KEY = 'reading-prefs';
const DEFAULT_READING: ReadingPrefs = {
  fontSize: 18,
  lineHeight: 1.9,
  maxWidth: 720,
};

export function getReadingPrefs(): ReadingPrefs {
  try {
    const raw = localStorage.getItem(READING_KEY);
    if (!raw) return { ...DEFAULT_READING };
    const p = JSON.parse(raw) as Partial<ReadingPrefs>;
    return {
      fontSize: p.fontSize ?? DEFAULT_READING.fontSize,
      lineHeight: p.lineHeight ?? DEFAULT_READING.lineHeight,
      maxWidth: p.maxWidth ?? DEFAULT_READING.maxWidth,
    };
  } catch {
    return { ...DEFAULT_READING };
  }
}

export function setReadingPrefs(p: ReadingPrefs): void {
  localStorage.setItem(READING_KEY, JSON.stringify(p));
  applyReadingPrefs(p);
}

export function applyReadingPrefs(p: ReadingPrefs = getReadingPrefs()): void {
  const root = document.documentElement;
  root.style.setProperty('--reading-font-size', `${p.fontSize}px`);
  root.style.setProperty('--reading-line-height', String(p.lineHeight));
  root.style.setProperty('--reading-max-width', `${p.maxWidth}px`);
}
