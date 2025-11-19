export type NoteMeta = {
  id: string;
  name: string;
  mime: string;
  size: number;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  tags?: string[];
  lastPage?: number;
  pinnedSlot?: number | null;
};

export type NoteRecord = {
  meta: NoteMeta;
  blob: Blob;
};

const DB_NAME = "whispr_notes_db_v1";
const STORE = "notes";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: "meta.id" });
        s.createIndex("updatedAt", "meta.updatedAt", { unique: false });
        s.createIndex("name", "meta.name", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putNote(rec: NoteRecord): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(rec);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getAllNotes(): Promise<NoteRecord[]> {
  const db = await openDb();
  const res = await new Promise<NoteRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as NoteRecord[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return res;
}

export async function getNote(id: string): Promise<NoteRecord | undefined> {
  const db = await openDb();
  const res = await new Promise<NoteRecord | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as NoteRecord | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return res;
}

export async function deleteNote(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function updateMeta(
  id: string,
  patch: Partial<NoteMeta>
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const rec = getReq.result as NoteRecord | undefined;
      if (!rec) return resolve();
      rec.meta = { ...rec.meta, ...patch, updatedAt: Date.now() };
      store.put(rec);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
