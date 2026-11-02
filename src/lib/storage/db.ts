/**
 * UniHub Native IndexedDB Persistence Engine
 * Zero-dependency, lightweight Promise wrapper for modern browser IndexedDB.
 */

export const DB_NAME = 'UniHub_DB';
export const DB_VERSION = 1;

export type StoreName =
  | 'semesters'
  | 'courses'
  | 'timetable'
  | 'assignments'
  | 'exams'
  | 'studySessions'
  | 'notes';

class IndexedDBClient {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not supported in this environment.'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Semesters
        if (!db.objectStoreNames.contains('semesters')) {
          db.createObjectStore('semesters', { keyPath: 'id' });
        }

        // 2. Courses
        if (!db.objectStoreNames.contains('courses')) {
          const store = db.createObjectStore('courses', { keyPath: 'id' });
          store.createIndex('by_semesterId', 'semesterId', { unique: false });
          store.createIndex('by_status', 'status', { unique: false });
        }

        // 3. Timetable Slots
        if (!db.objectStoreNames.contains('timetable')) {
          const store = db.createObjectStore('timetable', { keyPath: 'id' });
          store.createIndex('by_courseId', 'courseId', { unique: false });
          store.createIndex('by_dayOfWeek', 'dayOfWeek', { unique: false });
        }

        // 4. Assignments
        if (!db.objectStoreNames.contains('assignments')) {
          const store = db.createObjectStore('assignments', { keyPath: 'id' });
          store.createIndex('by_courseId', 'courseId', { unique: false });
          store.createIndex('by_dueDate', 'dueDate', { unique: false });
          store.createIndex('by_status', 'status', { unique: false });
        }

        // 5. Exams
        if (!db.objectStoreNames.contains('exams')) {
          const store = db.createObjectStore('exams', { keyPath: 'id' });
          store.createIndex('by_courseId', 'courseId', { unique: false });
          store.createIndex('by_examDate', 'examDate', { unique: false });
        }

        // 6. Study Sessions
        if (!db.objectStoreNames.contains('studySessions')) {
          const store = db.createObjectStore('studySessions', { keyPath: 'id' });
          store.createIndex('by_courseId', 'courseId', { unique: false });
          store.createIndex('by_startTime', 'startTime', { unique: false });
        }

        // 7. Notes
        if (!db.objectStoreNames.contains('notes')) {
          const store = db.createObjectStore('notes', { keyPath: 'id' });
          store.createIndex('by_courseId', 'courseId', { unique: false });
          store.createIndex('by_updatedAt', 'updatedAt', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Fetch all records from an object store
   */
  async getAll<T>(storeName: StoreName): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Fetch a single record by primary key (id)
   */
  async getById<T>(storeName: StoreName, id: string): Promise<T | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);

      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Insert or update a record
   */
  async put<T>(storeName: StoreName, item: T): Promise<T> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);

      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Delete a record by primary key
   */
  async delete(storeName: StoreName, id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Query records by secondary index
   */
  async getByIndex<T>(storeName: StoreName, indexName: string, queryValue: IDBValidKey): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const req = index.getAll(queryValue);

      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Clear all records in an object store
   */
  async clear(storeName: StoreName): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Bulk insert/replace items in a single transaction
   */
  async bulkPut<T>(storeName: StoreName, items: T[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      for (const item of items) {
        store.put(item);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const idb = new IndexedDBClient();
