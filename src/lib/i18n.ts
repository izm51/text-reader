export type Lang = 'ja' | 'en';
export type LangPref = 'system' | Lang;

const KEY = 'lang';

const ja = {
  'common.back': '戻る',
  'common.settings': '設定',

  'settings.title': '設定',
  'settings.theme': 'テーマ',
  'settings.theme.system': '端末に合わせる',
  'settings.theme.light': 'ライト',
  'settings.theme.dark': 'ダーク',
  'settings.reading': '本文表示',
  'settings.fontSize': 'フォントサイズ',
  'settings.lineHeight': '行間',
  'settings.maxWidth': '最大幅',
  'settings.reset': 'デフォルトに戻す',
  'settings.language': '言語',
  'settings.language.system': '端末に合わせる',
  'settings.usage': '使い方',
  'settings.usage.share':
    'ホーム画面に追加すると、他アプリの共有メニューから txt / md を直接取り込めます。',
  'settings.usage.storage':
    'ファイルはブラウザの IndexedDB に保存されます (永続化を要求しますが、長期未使用や端末側クリーンアップで消える可能性があります)。',

  'library.filter.all': 'ライブラリ',
  'library.filter.starred': 'スター',
  'library.filter.bookmarked': 'しおり',
  'library.filter.archived': 'アーカイブ',
  'library.intro': '登録したテキストを、音声読み上げで聞くことができます。',
  'library.upload.aria': 'ファイル取り込み',
  'library.upload.primary': 'タップ または ドラッグして追加',
  'library.upload.hint': '.txt / .md をアップロード',
  'library.paste.summary': 'テキストを直接貼り付け',
  'library.paste.placeholder': 'ここに本文を貼り付け…',
  'library.paste.title': 'タイトル（任意）',
  'library.paste.add': '追加',
  'library.search': '検索',
  'library.filter': '絞り込み',
  'library.search.placeholder': 'タイトルで絞り込み',
  'library.search.clear': 'クリア',
  'library.empty.noDocs': 'まだドキュメントがありません。txt / md ファイルを追加してください。',
  'library.empty.noMatch': '該当するドキュメントがありません。',
  'library.empty.starred': 'スター付きのドキュメントはありません。',
  'library.empty.bookmarked': 'しおりが付いたドキュメントはありません。',
  'library.empty.archived': 'アーカイブされたドキュメントはありません。',
  'library.storage.aria': 'ストレージ使用状況',
  'library.storage.label': 'ストレージ {used} MB / {quota} MB',

  'doc.star.add': 'スターを付ける',
  'doc.star.remove': 'スターを外す',
  'doc.menu': 'メニュー',
  'doc.archive': 'アーカイブ',
  'doc.unarchive': 'アーカイブ解除',
  'doc.delete': '削除',
  'doc.deleteConfirm': 'このドキュメントを削除します。よろしいですか？',

  'reader.back': 'ライブラリへ戻る',
  'reader.notFound.title': '見つかりません',
  'reader.notFound.body': 'ID {id} のドキュメントが見つかりませんでした。',
  'reader.title.aria': 'タイトル (編集可能)',
  'reader.player.aria': '読み上げプレイヤー',
  'reader.play': '再生',
  'reader.pause': '一時停止',
  'reader.resume': '再開',
  'reader.stop': '停止',
  'reader.rate': '速度',
  'reader.voice.label': '音声:',
  'reader.voice.aria': '音声',
  'reader.voice.auto': '自動 (端末既定)',
  'reader.playing': '再生中… ({cursor}/{total})',
  'reader.paused': '一時停止 ({cursor}/{total})',
  'reader.copy': '段落をコピー',
  'reader.copyFailed': 'コピーに失敗',
  'reader.bookmark.add': 'しおりを付ける',
  'reader.bookmark.remove': 'しおりを外す',
} as const;

export type MsgKey = keyof typeof ja;

const en: Record<MsgKey, string> = {
  'common.back': 'Back',
  'common.settings': 'Settings',

  'settings.title': 'Settings',
  'settings.theme': 'Theme',
  'settings.theme.system': 'Match device',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.reading': 'Text display',
  'settings.fontSize': 'Font size',
  'settings.lineHeight': 'Line spacing',
  'settings.maxWidth': 'Max width',
  'settings.reset': 'Reset to defaults',
  'settings.language': 'Language',
  'settings.language.system': 'Match device',
  'settings.usage': 'Tips',
  'settings.usage.share':
    "Add it to your home screen to import txt / md straight from other apps' share menus.",
  'settings.usage.storage':
    "Files are stored in the browser's IndexedDB (we request persistence, but they may be cleared after long disuse or device cleanup).",

  'library.filter.all': 'Library',
  'library.filter.starred': 'Starred',
  'library.filter.bookmarked': 'Bookmarks',
  'library.filter.archived': 'Archive',
  'library.intro': 'Listen to your saved text with text-to-speech.',
  'library.upload.aria': 'Import files',
  'library.upload.primary': 'Tap or drag to add',
  'library.upload.hint': 'Upload .txt / .md',
  'library.paste.summary': 'Paste text directly',
  'library.paste.placeholder': 'Paste your text here…',
  'library.paste.title': 'Title (optional)',
  'library.paste.add': 'Add',
  'library.search': 'Search',
  'library.filter': 'Filter',
  'library.search.placeholder': 'Filter by title',
  'library.search.clear': 'Clear',
  'library.empty.noDocs': 'No documents yet. Add a txt / md file.',
  'library.empty.noMatch': 'No matching documents.',
  'library.empty.starred': 'No starred documents.',
  'library.empty.bookmarked': 'No bookmarked documents.',
  'library.empty.archived': 'No archived documents.',
  'library.storage.aria': 'Storage usage',
  'library.storage.label': 'Storage {used} MB / {quota} MB',

  'doc.star.add': 'Add star',
  'doc.star.remove': 'Remove star',
  'doc.menu': 'Menu',
  'doc.archive': 'Archive',
  'doc.unarchive': 'Unarchive',
  'doc.delete': 'Delete',
  'doc.deleteConfirm': 'Delete this document. Are you sure?',

  'reader.back': 'Back to library',
  'reader.notFound.title': 'Not found',
  'reader.notFound.body': 'No document found for ID {id}.',
  'reader.title.aria': 'Title (editable)',
  'reader.player.aria': 'Playback player',
  'reader.play': 'Play',
  'reader.pause': 'Pause',
  'reader.resume': 'Resume',
  'reader.stop': 'Stop',
  'reader.rate': 'Speed',
  'reader.voice.label': 'Voice:',
  'reader.voice.aria': 'Voice',
  'reader.voice.auto': 'Auto (device default)',
  'reader.playing': 'Playing… ({cursor}/{total})',
  'reader.paused': 'Paused ({cursor}/{total})',
  'reader.copy': 'Copy paragraph',
  'reader.copyFailed': 'Copy failed',
  'reader.bookmark.add': 'Add bookmark',
  'reader.bookmark.remove': 'Remove bookmark',
};

const messages: Record<Lang, Record<MsgKey, string>> = { ja, en };

function detectLang(): Lang {
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const l of candidates) {
    const lower = l.toLowerCase();
    if (lower.startsWith('ja')) return 'ja';
    if (lower.startsWith('en')) return 'en';
  }
  return 'en';
}

export function getLangPref(): LangPref {
  const v = localStorage.getItem(KEY);
  if (v === 'ja' || v === 'en' || v === 'system') return v;
  return 'system';
}

export function resolveLang(pref: LangPref = getLangPref()): Lang {
  return pref === 'ja' || pref === 'en' ? pref : detectLang();
}

export function getLang(): Lang {
  return resolveLang();
}

export function getLocale(): string {
  return getLang() === 'ja' ? 'ja-JP' : 'en-US';
}

export function setLangPref(pref: LangPref): void {
  localStorage.setItem(KEY, pref);
  applyLang();
}

export function applyLang(): void {
  document.documentElement.lang = getLang();
}

export function t(key: MsgKey, params?: Record<string, string | number>): string {
  let s = messages[getLang()][key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return s;
}
