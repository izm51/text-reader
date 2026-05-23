import MarkdownIt from 'markdown-it';
import type { DocFormat } from './db';

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
  typographer: false,
});

export function detectFormat(filename: string): DocFormat {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'md';
  return 'txt';
}

export function deriveTitle(filename: string, content: string): string {
  const base = filename.replace(/\.[^.]+$/, '').trim();
  if (base) return base;
  const firstLine = content
    .split(/\r?\n/)
    .map((l) => l.replace(/^#+\s*/, '').trim())
    .find((l) => l.length > 0);
  return firstLine?.slice(0, 80) || '無題';
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderTxtToHtml(content: string): string {
  const normalized = content.replace(/\r\n?/g, '\n');
  const paragraphs = normalized.split(/\n{2,}/);
  return paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      const escaped = escapeHtml(trimmed).replace(/\n/g, '<br />');
      return `<p>${escaped}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

export function renderMdToHtml(content: string): string {
  return md.render(content);
}

export function renderToHtml(format: DocFormat, content: string): string {
  return format === 'md' ? renderMdToHtml(content) : renderTxtToHtml(content);
}

// reader.ts の TTS_BLOCK_SELECTOR / tagBlocks と同じインデックス付けで
// 段落テキストだけを抜き出す。しおりカードの表示に使う。
const BLOCK_SELECTOR = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, pre';

export function getBlockTexts(format: DocFormat, content: string): string[] {
  const html = renderToHtml(format, content);
  const container = document.createElement('div');
  container.innerHTML = html;
  const texts: string[] = [];
  container.querySelectorAll<HTMLElement>(BLOCK_SELECTOR).forEach((el) => {
    if (el.closest('pre') && el.tagName !== 'PRE') return;
    if (el.tagName === 'LI' && el.querySelector('ul, ol')) return;
    const text = (el.textContent || '').trim();
    if (!text) return;
    texts.push(text);
  });
  return texts;
}

