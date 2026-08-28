import type { JSONContent } from "@tiptap/react";
import type { NotebookState, NotebookPageState } from "@/types/notebook";
const DB_NAME = "notebook-db";
const STORE_NAME = "notebooks";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function createNotebook(notebook: NotebookState): Promise<void> {
  const db = await openDB();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.put(notebook);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getNotebooks(): Promise<NotebookState[]> {
  const db = await openDB();

  return new Promise<NotebookState[]>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getNotebook(
  id: string,
): Promise<NotebookState | undefined> {
  const db = await openDB();

  return new Promise<NotebookState | undefined>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getNotebookPage(
  notebookId: string,
  pageId: string,
): Promise<NotebookPageState> {
  const db = await openDB();

  return new Promise<NotebookPageState>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(notebookId);

    request.onsuccess = () => {
      const notebook = request.result as NotebookState | undefined;

      if (!notebook) {
        reject(new Error("Notebook not found"));
        return;
      }

      const page = notebook.pages.find((p) => p.id === pageId);

      if (!page) {
        reject(new Error("Notebook page not found"));
        return;
      }

      resolve(page);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function updateNotebookTitle(
  notebookId: string,
  title: string,
): Promise<void> {
  const db = await openDB();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(notebookId);

    request.onsuccess = () => {
      const notebook = request.result;

      if (!notebook) {
        reject(new Error("Notebook not found"));
        return;
      }

      notebook.title = title;

      store.put(notebook);
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function updateNotebookPage(
  notebookId: string,
  pageId: string,
  content: JSONContent,
): Promise<void> {
  const db = await openDB();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(notebookId);

    request.onsuccess = () => {
      const notebook = request.result as NotebookState | undefined;

      if (!notebook) {
        reject(new Error("Notebook not found"));
        return;
      }

      const page = notebook.pages.find((p) => p.id === pageId);

      if (!page) {
        reject(new Error("Notebook page not found"));
        return;
      }

      page.content = content;

      store.put(notebook);
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function addNotebookPage(
  notebookId: string,
  page: NotebookPageState,
): Promise<void> {
  const db = await openDB();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(notebookId);

    request.onsuccess = () => {
      const notebook = request.result as NotebookState | undefined;

      if (!notebook) {
        reject(new Error("Notebook not found"));
        return;
      }

      notebook.pages.push(page);
      notebook.totalPages = notebook.pages.length;

      store.put(notebook);
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export function deleteNotebookDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase("notebookDB");

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      console.warn("Database deletion is blocked by an open connection.");
    };
  });
}
