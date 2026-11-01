import type { JSONContent } from "@tiptap/react";
import type { NotebookState, NotebookPageState } from "@/types/Notebook";
import { createEmptyNotebookPage } from "./CreateNotebookPages";
const DB_NAME = "notebook-db";
const STORE_NAME = "notebooks";

// One connection shared by every call, opened the first time it's needed
let dbPromise: Promise<IDBDatabase> | null = null;

// IndexedDB-backed storage for notebooks and their pages.
// Opens the notebooks IndexedDB database, creating it on first use
function openDB(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
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
      const db = request.result;

      // Lets a wipe or a newer version go through instead of waiting on us
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };

      resolve(db);
    };

    request.onerror = () => {
      // So the next call tries again
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

// A name left blank or only spaces becomes Untitled Notebook
function cleanTitle(title: string): string {
  return title.trim() || "Untitled Notebook";
}

// Saves a new notebook
export async function createNotebook(notebook: NotebookState): Promise<void> {
  const db = await openDB();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.put({ ...notebook, title: cleanTitle(notebook.title) });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Fetches every saved notebook
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

// Fetches one notebook by id
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

// Fetches one page from one notebook
export async function getNotebookPage(
  notebookId: string,
  pageId: string,
): Promise<NotebookPageState> {
  const notebook = await getNotebook(notebookId);
  if (!notebook) throw new Error("Notebook not found");

  const page = notebook.pages.find((p) => p.id === pageId);
  if (!page) throw new Error("Notebook page not found");

  return page;
}

// Reads one notebook, lets change edit it, and saves it back, all as one
// write so nothing else can save in between
async function changeNotebook(
  notebookId: string,
  change: (notebook: NotebookState) => void,
): Promise<NotebookState> {
  const db = await openDB();

  return new Promise<NotebookState>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(notebookId);

    request.onsuccess = () => {
      const notebook = request.result as NotebookState | undefined;

      if (!notebook) {
        reject(new Error("Notebook not found"));
        return;
      }

      // A change that fails, like a missing page, saves nothing
      try {
        change(notebook);
      } catch (error) {
        transaction.abort();
        reject(error);
        return;
      }

      store.put(notebook);
      transaction.oncomplete = () => resolve(notebook);
    };

    transaction.onerror = () => reject(transaction.error);
  });
}

// Renames a notebook
export async function updateNotebookTitle(
  notebookId: string,
  title: string,
): Promise<void> {
  await changeNotebook(notebookId, (notebook) => {
    notebook.title = cleanTitle(title);
  });
}

// Overwrites one page's content within a notebook
export async function updateNotebookPage(
  notebookId: string,
  pageId: string,
  content: JSONContent,
): Promise<void> {
  await changeNotebook(notebookId, (notebook) => {
    const page = notebook.pages.find((p) => p.id === pageId);
    if (!page) throw new Error("Notebook page not found");

    page.content = content;
  });
}

// Adds blank pages until the notebook has a page at lastPageIndex, all in one
// transaction, and returns the notebook
export function ensurePagesExist(
  notebookId: string,
  lastPageIndex: number,
): Promise<NotebookState> {
  return changeNotebook(notebookId, (notebook) => {
    // Page numbers match their index, so each new page is numbered by where it lands
    for (
      let pageIndex = notebook.pages.length;
      pageIndex <= lastPageIndex;
      pageIndex++
    ) {
      notebook.pages.push(createEmptyNotebookPage(pageIndex));
    }
  });
}

// Wipes the entire notebooks database
export function deleteNotebookDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      console.warn("Database deletion is blocked by an open connection.");
    };
  });
}
