import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export type DocFormat = 'txt' | 'md';

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
  bookmarks?: number[];
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
const DB_VERSION = 2;

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
        // v1 -> v2: bookmarks フィールド追加。既存レコードは bookmarks
        // が undefined のまま残り、読み出し時に `?? []` で吸収される。
        // スキーマ変更は無いのでデータ移行は不要。
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
  return all.reverse();
}

export async function getDocument(id: number): Promise<DocRecord | undefined> {
  const db = await getDB();
  return db.get('documents', id);
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

export function setBookmarks(id: number, bookmarks: number[]): Promise<void> {
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
