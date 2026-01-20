// Hook para gerenciar documentos salvos no IndexedDB
// Não pesa na RAM pois armazena no banco de dados do navegador

const DB_NAME = "rsvp-documents";
const DB_VERSION = 1;
const STORE_NAME = "documents";

export interface SavedDocument {
  id: string;
  name: string;
  text: string;
  wordCount: number;
  createdAt: number;
  lastReadAt: number;
  lastPosition: number;
  fileType: "txt" | "pdf";
}

class RSVPDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("name", "name", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
          store.createIndex("lastReadAt", "lastReadAt", { unique: false });
        }
      };
    });
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  async saveDocument(doc: SavedDocument): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(doc);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getDocument(id: string): Promise<SavedDocument | undefined> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAllDocuments(): Promise<SavedDocument[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const docs = request.result as SavedDocument[];
        // Ordenar por último acesso
        docs.sort((a, b) => b.lastReadAt - a.lastReadAt);
        resolve(docs);
      };
    });
  }

  async deleteDocument(id: string): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateLastPosition(id: string, position: number): Promise<void> {
    const doc = await this.getDocument(id);
    if (doc) {
      doc.lastPosition = position;
      doc.lastReadAt = Date.now();
      await this.saveDocument(doc);
    }
  }

  async clearAll(): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Singleton instance
export const rsvpDb = new RSVPDatabase();

// Utility para gerar ID único
export const generateDocId = (): string => {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
