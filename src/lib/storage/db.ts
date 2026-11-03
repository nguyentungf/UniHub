/**
 * UniHub Native IndexedDB Persistence Engine
 * Zero-dependency, lightweight Promise wrapper for modern browser IndexedDB.
 */

export type DatabaseMode = 'real' | 'demo';
export const DATA_MODE_KEY = 'unihub_data_mode_v2';

export const REAL_DB_NAME = 'UniHub_Real_DB';
export const DEMO_DB_NAME = 'UniHub_Demo_DB';
export const DB_VERSION = 1;

export function getDatabaseMode(): DatabaseMode {
  if (typeof window === 'undefined') return 'real';
  const saved = localStorage.getItem(DATA_MODE_KEY);
  return saved === 'demo' ? 'demo' : 'real';
}

export function setDatabaseModeKey(mode: DatabaseMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DATA_MODE_KEY, mode);
}

export function getActiveDbName(): string {
  return getDatabaseMode() === 'demo' ? DEMO_DB_NAME : REAL_DB_NAME;
}

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
  private currentDbName: string = '';

  public close(): void {
    if (this.dbPromise) {
      this.dbPromise.then((db) => {
        try {
          db.close();
        } catch {
          // ignore
        }
      }).catch(() => {});
      this.dbPromise = null;
      this.currentDbName = '';
    }
  }

  public switchDatabase(mode: DatabaseMode): void {
    setDatabaseModeKey(mode);
    this.close();
  }

  private getDB(): Promise<IDBDatabase> {
    const targetDbName = getActiveDbName();

    if (this.dbPromise && this.currentDbName === targetDbName) {
      return this.dbPromise;
    }

    if (this.dbPromise && this.currentDbName !== targetDbName) {
      this.close();
    }
    this.currentDbName = targetDbName;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not supported in this environment.'));
      }

      const request = window.indexedDB.open(targetDbName, DB_VERSION);

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

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          this.dbPromise = null;
        };
        db.onclose = () => {
          this.dbPromise = null;
        };
        resolve(db);
      };
      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
      request.onblocked = () => {
        console.warn('UniHub IndexedDB connection blocked by another open tab.');
      };
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
      store.put(item);

      tx.oncomplete = () => resolve(item);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
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
      store.delete(id);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
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
      store.clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
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
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
    });
  }

  /**
   * Bulk delete items by keys in a single transaction
   */
  async bulkDelete(storeName: StoreName, ids: string[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      for (const id of ids) {
        store.delete(id);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
    });
  }

  /**
   * Atomic cascade deletion across courses and all related object stores in a single transaction.
   * If any operation fails or aborts, all modifications across all 6 stores are automatically rolled back by IndexedDB.
   */
  async deleteCourseCascadeAtomic(
    courseId: string,
    cascadeIds: {
      slotIds: string[];
      assignmentIds: string[];
      examIds: string[];
      noteIds: string[];
      sessionIds: string[];
    }
  ): Promise<void> {
    const db = await this.getDB();
    const storeNames: StoreName[] = [
      'courses',
      'timetable',
      'assignments',
      'exams',
      'notes',
      'studySessions',
    ];

    return new Promise((resolve, reject) => {
      let tx: IDBTransaction;
      try {
        tx = db.transaction(storeNames, 'readwrite');
      } catch (err) {
        return reject(err);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Atomic cascade transaction aborted'));

      try {
        // 1. Delete target course
        const coursesStore = tx.objectStore('courses');
        coursesStore.delete(courseId);

        // 2. Cascade delete timetable slots
        const timetableStore = tx.objectStore('timetable');
        for (const slotId of cascadeIds.slotIds) {
          timetableStore.delete(slotId);
        }

        // 3. Cascade delete assignments
        const assignmentsStore = tx.objectStore('assignments');
        for (const assignmentId of cascadeIds.assignmentIds) {
          assignmentsStore.delete(assignmentId);
        }

        // 4. Cascade delete exams
        const examsStore = tx.objectStore('exams');
        for (const examId of cascadeIds.examIds) {
          examsStore.delete(examId);
        }

        // 5. Cascade delete notes
        const notesStore = tx.objectStore('notes');
        for (const noteId of cascadeIds.noteIds) {
          notesStore.delete(noteId);
        }

        // 6. Cascade delete study sessions
        const studyStore = tx.objectStore('studySessions');
        for (const sessionId of cascadeIds.sessionIds) {
          studyStore.delete(sessionId);
        }
      } catch (err) {
        try {
          tx.abort();
        } catch {
          // ignore
        }
        reject(err);
      }
    });
  }

  /**
   * Restores an entire backup payload atomically across all 7 object stores in a single transaction.
   * If any step fails during clearing or writing, the entire transaction is aborted and rolled back by IndexedDB,
   * guaranteeing that existing data is never wiped out or corrupted on failure.
   */
  async restoreBackupAtomic(data: {
    semesters: unknown[];
    courses: unknown[];
    timetable: unknown[];
    assignments: unknown[];
    exams: unknown[];
    studySessions: unknown[];
    notes: unknown[];
  }): Promise<void> {
    const db = await this.getDB();
    const storeNames: StoreName[] = [
      'semesters',
      'courses',
      'timetable',
      'assignments',
      'exams',
      'studySessions',
      'notes',
    ];

    return new Promise((resolve, reject) => {
      let tx: IDBTransaction;
      try {
        tx = db.transaction(storeNames, 'readwrite');
      } catch (err) {
        return reject(err);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Backup restore transaction aborted'));

      try {
        // 1. Clear all 7 stores in this atomic transaction
        for (const storeName of storeNames) {
          tx.objectStore(storeName).clear();
        }

        // 2. Populate all 7 stores from backup payload
        const semStore = tx.objectStore('semesters');
        for (const s of data.semesters || []) semStore.put(s);

        const courseStore = tx.objectStore('courses');
        for (const c of data.courses || []) courseStore.put(c);

        const ttStore = tx.objectStore('timetable');
        for (const t of data.timetable || []) ttStore.put(t);

        const asgStore = tx.objectStore('assignments');
        for (const a of data.assignments || []) asgStore.put(a);

        const examStore = tx.objectStore('exams');
        for (const e of data.exams || []) examStore.put(e);

        const studyStore = tx.objectStore('studySessions');
        for (const ss of data.studySessions || []) studyStore.put(ss);

        const noteStore = tx.objectStore('notes');
        for (const n of data.notes || []) noteStore.put(n);
      } catch (err) {
        try {
          tx.abort();
        } catch {
          // ignore
        }
        reject(err);
      }
    });
  }
}

export const idb = new IndexedDBClient();
