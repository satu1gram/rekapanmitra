/**
 * Resilient storage adapter for Supabase auth.
 *
 * iOS PWA (standalone mode) can aggressively clear localStorage when the app
 * is killed from the multitasking view or under memory pressure.
 * IndexedDB is significantly more persistent on iOS/Android PWAs.
 *
 * Strategy: write to BOTH localStorage (fast sync reads) and IndexedDB (durable).
 * On read: try localStorage first, fall back to IndexedDB.
 */

const DB_NAME = 'rekapan-auth';
const STORE_NAME = 'kv';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, value: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Silently fail — localStorage still has the value
  }
}

async function idbRemove(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Silently fail
  }
}

/**
 * Supabase v2 SupportedStorage — methods may return Promises.
 */
export const resilientStorage = {
  async getItem(key: string): Promise<string | null> {
    // Fast path: try localStorage (synchronous)
    try {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    } catch {
      // localStorage might be unavailable
    }
    // Fallback: IndexedDB (survives iOS PWA storage eviction)
    const idbVal = await idbGet(key);
    // Re-hydrate localStorage so future reads are fast
    if (idbVal !== null) {
      try { localStorage.setItem(key, idbVal); } catch {}
    }
    return idbVal;
  },

  async setItem(key: string, value: string): Promise<void> {
    try { localStorage.setItem(key, value); } catch {}
    await idbSet(key, value);
  },

  async removeItem(key: string): Promise<void> {
    try { localStorage.removeItem(key); } catch {}
    await idbRemove(key);
  },
};
