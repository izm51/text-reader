/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { openDB } from 'idb';

declare const self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('install', () => {
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const DB_NAME = 'text-reader';
const STORE = 'documents';

async function getDB() {
  return openDB(DB_NAME, 4, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const store = db.createObjectStore(STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('updatedAt', 'updatedAt');
      }
      // v1 -> v2: bookmarks フィールド追加。
      // v2 -> v3: archived フィールド追加。
      // v3 -> v4: bookmarks を { index, addedAt }[] に拡張 (lazy 正規化)。
    },
    blocked() {
      console.warn('text-reader IDB upgrade blocked by another tab/worker');
    },
  });
}

function detectFormat(name: string): 'txt' | 'md' {
  const lower = name.toLowerCase();
  return lower.endsWith('.md') || lower.endsWith('.markdown') ? 'md' : 'txt';
}

function deriveTitle(filename: string, content: string): string {
  const base = filename.replace(/\.[^.]+$/, '').trim();
  if (base) return base;
  const firstLine = content
    .split(/\r?\n/)
    .map((l) => l.replace(/^#+\s*/, '').trim())
    .find((l) => l.length > 0);
  return firstLine?.slice(0, 80) || '無題';
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'POST') return;
  const url = new URL(req.url);
  if (!url.pathname.endsWith('/share')) return;
  event.respondWith(handleShare(req, url));
});

async function handleShare(request: Request, url: URL): Promise<Response> {
  let lastId: number | undefined;

  try {
    const formData = await request.formData();
    const files = formData.getAll('file').filter((f): f is File => f instanceof File);
    const text = (formData.get('text') as string | null) ?? '';
    const sharedTitle = (formData.get('title') as string | null) ?? '';
    const sharedUrl = (formData.get('url') as string | null) ?? '';

    const db = await getDB();
    const now = Date.now();

    for (const file of files) {
      if (!file || file.size === 0) continue;
      const content = await file.text();
      const format = detectFormat(file.name);
      const title = deriveTitle(file.name, content);
      lastId = (await db.add(STORE, {
        title,
        content,
        format,
        createdAt: now,
        updatedAt: now,
        byteSize: new Blob([content]).size,
      })) as number;
    }

    if (lastId === undefined && (text || sharedUrl)) {
      const combined = [sharedTitle, sharedUrl, text].filter(Boolean).join('\n\n');
      lastId = (await db.add(STORE, {
        title: sharedTitle || '共有テキスト',
        content: combined,
        format: 'txt',
        createdAt: now,
        updatedAt: now,
        byteSize: new Blob([combined]).size,
      })) as number;
    }
  } catch (err) {
    console.error('share handler failed', err);
  }

  const base = url.pathname.replace(/\/share$/, '/');
  const dest = lastId !== undefined ? `${base}?doc=${lastId}` : `${base}?shared=1`;
  return Response.redirect(dest, 303);
}
