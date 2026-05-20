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
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<TextReaderDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<TextReaderDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TextReaderDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('documents')) {
          const store = db.createObjectStore('documents', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('updatedAt', 'updatedAt');
        }
      },
    });
  }
  return dbPromise;
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

export async function updateDocument(
  id: number,
  patch: Partial<DocRecord>,
): Promise<void> {
  const db = await getDB();
  const cur = await db.get('documents', id);
  if (!cur) return;
  await db.put('documents', {
    ...cur,
    ...patch,
    id,
    updatedAt: Date.now(),
  });
}

export async function setStarred(id: number, starred: boolean): Promise<void> {
  const db = await getDB();
  const cur = await db.get('documents', id);
  if (!cur) return;
  await db.put('documents', { ...cur, starred, id });
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
