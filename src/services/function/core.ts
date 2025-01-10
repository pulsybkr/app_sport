import { DBConfig } from './types.js';

export class DatabaseCore {
    private db: IDBDatabase | null = null;
    private config: DBConfig;

    constructor(config: DBConfig) {
        this.config = config;
    }

    async initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.config.name, this.config.version);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                
                this.config.stores.forEach(store => {
                    if (!db.objectStoreNames.contains(store.name)) {
                        const objectStore = db.createObjectStore(store.name, {
                            keyPath: store.keyPath,
                            autoIncrement: true
                        });

                        store.indexes.forEach(index => {
                            objectStore.createIndex(index.name, index.keyPath, index.options);
                        });
                    }
                });
            };
        });
    }

    protected async getDB(): Promise<IDBDatabase> {
        if (!this.db) {
            await this.initDB();
        }
        return this.db!;
    }

    protected async executeTransaction<T>(
        storeName: string,
        mode: IDBTransactionMode,
        callback: (store: IDBObjectStore) => IDBRequest
    ): Promise<T> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], mode);
            const store = transaction.objectStore(storeName);
            const request = callback(store);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    protected async add<T>(storeName: string, data: T): Promise<IDBValidKey> {
        return this.executeTransaction<IDBValidKey>(storeName, 'readwrite', (store) => {
            return store.add(data);
        });
    }

    protected async update<T>(storeName: string, data: T): Promise<IDBValidKey> {
        return this.executeTransaction<IDBValidKey>(storeName, 'readwrite', (store) => {
            return store.put(data);
        });
    }

    protected async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
        return this.executeTransaction<T>(storeName, 'readonly', (store) => {
            return store.get(key);
        });
    }

    protected async getAll<T>(storeName: string): Promise<T[]> {
        return this.executeTransaction<T[]>(storeName, 'readonly', (store) => {
            return store.getAll();
        });
    }

    protected async delete(storeName: string, key: IDBValidKey): Promise<void> {
        return this.executeTransaction<void>(storeName, 'readwrite', (store) => {
            return store.delete(key);
        });
    }

    protected async clear(storeName: string): Promise<void> {
        return this.executeTransaction<void>(storeName, 'readwrite', (store) => {
            return store.clear();
        });
    }
} 