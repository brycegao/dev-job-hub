/**
 * IndexedDB 本地存储封装。
 * 数据库名：developer-job-hunt-crm，当前版本 3。
 * 提供通用的 open / getAll / put / delete / clear 操作。
 */

const DB_NAME = "developer-job-hunt-crm";
const DB_VERSION = 3;

/** 可操作的 ObjectStore 名称 */
type StoreName = "applications" | "resumes" | "interviews";

/** 缓存数据库连接 Promise，避免重复打开 */
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * 打开 IndexedDB 数据库连接，自动处理升级和索引创建。
 * 连接会被缓存，后续调用直接返回已有连接。
 */
export function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("applications")) {
        const store = db.createObjectStore("applications", { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("appliedAt", "appliedAt", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
      if (!db.objectStoreNames.contains("resumes")) {
        const store = db.createObjectStore("resumes", { keyPath: "id" });
        store.createIndex("targetRole", "targetRole", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
      if (!db.objectStoreNames.contains("interviews")) {
        const store = db.createObjectStore("interviews", { keyPath: "id" });
        store.createIndex("jobApplicationId", "jobApplicationId", { unique: false });
        store.createIndex("scheduledAt", "scheduledAt", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

/** 读取指定 ObjectStore 中的所有记录，按 updatedAt 降序排列 */
export async function getAllFromStore<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

/** 向指定 ObjectStore 写入或更新一条记录 */
export async function putInStore<T>(storeName: StoreName, value: T): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(value);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/** 从指定 ObjectStore 中删除一条记录 */
export async function deleteFromStore(storeName: StoreName, id: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/** 清空指定 ObjectStore 中的所有记录 */
export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
