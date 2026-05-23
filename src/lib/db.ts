import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export type DocFormat = 'txt' | 'md';

export interface BookmarkEntry {
  index: number;
  addedAt: number;
}

export interface DocRecord {
  id?: number;
  title: string;
  content: string;
  format: DocFormat;
  createdAt: number;
  updatedAt: number;
  byteSize: number;
  lastReadPosition?: number;
  starred?: boolean;
  // v3 までは number[]。v4 から BookmarkEntry[]。読み出しは
  // 必ず getDocument / listDocuments を通すので、外には常に正規化
  // 済みの BookmarkEntry[] が出る。
  bookmarks?: BookmarkEntry[];
  archived?: boolean;
}

interface TextReaderDB extends DBSchema {
  documents: {
    key: number;
    value: DocRecord;
    indexes: {
      createdAt: number;
      updatedAt: number;
    };
  };
}

const DB_NAME = 'text-reader';
const DB_VERSION = 4;

let dbPromise: Promise<IDBPDatabase<TextReaderDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<TextReaderDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TextReaderDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const store = db.createObjectStore('documents', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('updatedAt', 'updatedAt');
        }
        // v1 -> v2: bookmarks フィールド追加。
        // v2 -> v3: archived フィールド追加。
        // v3 -> v4: bookmarks を number[] から { index, addedAt }[] へ。
        //   既存レコードはそのまま放置し、読み出し時に normalizeBookmarks で
        //   addedAt = updatedAt のフォールバックを付ける。書き込みは常に
        //   新形式で行われるので、触ったしおりから順に新形式に置き換わる。
      },
      blocked() {
        console.warn('text-reader IDB upgrade blocked by another tab/worker');
      },
      blocking() {
        // 別タブが新バージョンに上げようとしているのを邪魔しない。
        const stale = dbPromise;
        dbPromise = null;
        void stale?.then((db) => db.close()).catch(() => {});
      },
    });
  }
  return dbPromise;
}

function normalizeBookmarks(raw: unknown, fallback: number): BookmarkEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: BookmarkEntry[] = [];
  for (const b of raw) {
    if (typeof b === 'number') {
      out.push({ index: b, addedAt: fallback });
    } else if (b && typeof b === 'object') {
      const entry = b as Partial<BookmarkEntry>;
      if (typeof entry.index === 'number') {
        out.push({
          index: entry.index,
          addedAt: typeof entry.addedAt === 'number' ? entry.addedAt : fallback,
        });
      }
    }
  }
  return out;
}

function normalizeDoc(doc: DocRecord): DocRecord {
  doc.bookmarks = normalizeBookmarks(doc.bookmarks, doc.updatedAt ?? Date.now());
  return doc;
}

async function patchDocument(
  id: number,
  patch: (cur: DocRecord) => DocRecord,
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('documents', 'readwrite');
  const cur = await tx.store.get(id);
  if (cur) await tx.store.put(patch(cur));
  await tx.done;
}

export async function listDocuments(): Promise<DocRecord[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('documents', 'updatedAt');
  all.reverse();
  for (const doc of all) normalizeDoc(doc);
  return all;
}

export async function getDocument(id: number): Promise<DocRecord | undefined> {
  const db = await getDB();
  const doc = await db.get('documents', id);
  return doc ? normalizeDoc(doc) : undefined;
}

export async function addDocument(
  rec: Omit<DocRecord, 'id' | 'createdAt' | 'updatedAt' | 'byteSize'>,
): Promise<number> {
  const db = await getDB();
  const now = Date.now();
  const id = await db.add('documents', {
    ...rec,
    createdAt: now,
    updatedAt: now,
    byteSize: new Blob([rec.content]).size,
  });
  return id as number;
}

export function updateDocument(id: number, patch: Partial<DocRecord>): Promise<void> {
  return patchDocument(id, (cur) => ({ ...cur, ...patch, id, updatedAt: Date.now() }));
}

export function setStarred(id: number, starred: boolean): Promise<void> {
  return patchDocument(id, (cur) => ({ ...cur, starred, id }));
}

export function setArchived(id: number, archived: boolean): Promise<void> {
  return patchDocument(id, (cur) => ({ ...cur, archived, id }));
}

export function setBookmarks(id: number, bookmarks: BookmarkEntry[]): Promise<void> {
  return patchDocument(id, (cur) => ({ ...cur, bookmarks, id }));
}

export async function deleteDocument(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('documents', id);
}

export async function getStorageEstimate(): Promise<StorageEstimate | null> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      return await navigator.storage.estimate();
    } catch {
      return null;
    }
  }
  return null;
}
