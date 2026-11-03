import type { JSONContent } from "@tiptap/react";
import type {
  NotebookState,
  NotebookPageState,
  NotebookSummary,
  StoredPage,
} from "@/types/Notebook";
import { createEmptyNotebookPage } from "./CreateNotebookPages";
const DB_NAME = "notebook-db";
const DB_VERSION = 2;

// Notebooks are saved without their pages, so the library can load them all
// cheaply, and each page is saved on its own, so autosave writes one page
const NOTEBOOK_STORE = "notebooks";
const PAGE_STORE = "pages";

// Finds every page of one notebook in the page store
const NOTEBOOK_ID_INDEX = "notebookId";

// One connection shared by every call, opened the first time it's needed
let dbPromise: Promise<IDBDatabase> | null = null;

// IndexedDB-backed storage for notebooks and their pages.
// Opens the notebooks IndexedDB database, creating it on first use
function openDB(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(NOTEBOOK_STORE)) {
        db.createObjectStore(NOTEBOOK_STORE, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(PAGE_STORE)) {
        db.createObjectStore(PAGE_STORE, { keyPath: "id" }).createIndex(
          NOTEBOOK_ID_INDEX,
          "notebookId",
        );
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

// Waits for one read or write to finish and gives back its result
function waitFor<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Waits until every write in the transaction is saved
function waitForSave(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// A notebook's pages, in page order
async function getPages(
  transaction: IDBTransaction,
  notebookId: string,
): Promise<StoredPage[]> {
  const index = transaction.objectStore(PAGE_STORE).index(NOTEBOOK_ID_INDEX);
  const pages: StoredPage[] = await waitFor(index.getAll(notebookId));
  return pages.sort((a, b) => a.pageNumber - b.pageNumber);
}

// A name left blank or only spaces becomes Untitled Notebook
function cleanTitle(title: string): string {
  return title.trim() || "Untitled Notebook";
}

// Saves a new notebook and its pages
export async function createNotebook(notebook: NotebookState): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([NOTEBOOK_STORE, PAGE_STORE], "readwrite");
  const { pages, ...summary } = notebook;

  transaction
    .objectStore(NOTEBOOK_STORE)
    .put({ ...summary, title: cleanTitle(summary.title) });
  pages.forEach((page) =>
    transaction.objectStore(PAGE_STORE).put({ ...page, notebookId: notebook.id }),
  );

  await waitForSave(transaction);
}

// Fetches every saved notebook, without their pages
export async function getNotebooks(): Promise<NotebookSummary[]> {
  const db = await openDB();
  const store = db.transaction(NOTEBOOK_STORE).objectStore(NOTEBOOK_STORE);
  return waitFor(store.getAll());
}

// Fetches one notebook by id, with all its pages
export async function getNotebook(
  id: string,
): Promise<NotebookState | undefined> {
  const db = await openDB();
  const transaction = db.transaction([NOTEBOOK_STORE, PAGE_STORE]);

  const [summary, pages] = await Promise.all([
    waitFor<NotebookSummary | undefined>(
      transaction.objectStore(NOTEBOOK_STORE).get(id),
    ),
    getPages(transaction, id),
  ]);
  return summary && { ...summary, pages };
}

// Fetches one page from one notebook
export async function getNotebookPage(
  notebookId: string,
  pageId: string,
): Promise<NotebookPageState> {
  const db = await openDB();
  const store = db.transaction(PAGE_STORE).objectStore(PAGE_STORE);

  const page = await waitFor<StoredPage | undefined>(store.get(pageId));
  if (page?.notebookId !== notebookId) {
    throw new Error("Notebook page not found");
  }
  return page;
}

// Reads one saved item, lets change edit it, and saves it back, all as one
// write so nothing else can save in between
async function changeSaved<T>(
  storeName: string,
  key: string,
  change: (saved: T) => void,
): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(storeName, "readwrite");
  const store = transaction.objectStore(storeName);

  const saved = await waitFor<T | undefined>(store.get(key));

  // A change that fails, like a missing page, saves nothing
  try {
    if (!saved) throw new Error(`Nothing saved in ${storeName} for ${key}`);
    change(saved);
  } catch (error) {
    transaction.abort();
    throw error;
  }

  store.put(saved);
  await waitForSave(transaction);
}

// Renames a notebook
export function updateNotebookTitle(
  notebookId: string,
  title: string,
): Promise<void> {
  return changeSaved<NotebookSummary>(NOTEBOOK_STORE, notebookId, (notebook) => {
    notebook.title = cleanTitle(title);
  });
}

// Overwrites one page's content within a notebook
export function updateNotebookPage(
  notebookId: string,
  pageId: string,
  content: JSONContent,
): Promise<void> {
  return changeSaved<StoredPage>(PAGE_STORE, pageId, (page) => {
    if (page.notebookId !== notebookId) {
      throw new Error("Notebook page not found");
    }
    page.content = content;
  });
}

// Adds blank pages until the notebook has a page at lastPageIndex, all in one
// transaction, and returns the notebook
export async function ensurePagesExist(
  notebookId: string,
  lastPageIndex: number,
): Promise<NotebookState> {
  const db = await openDB();
  const transaction = db.transaction([NOTEBOOK_STORE, PAGE_STORE], "readwrite");

  const [summary, pages] = await Promise.all([
    waitFor<NotebookSummary | undefined>(
      transaction.objectStore(NOTEBOOK_STORE).get(notebookId),
    ),
    getPages(transaction, notebookId),
  ]);
  if (!summary) throw new Error("Notebook not found");

  // Page numbers match their index, so each new page is numbered by where it lands
  for (let pageIndex = pages.length; pageIndex <= lastPageIndex; pageIndex++) {
    const page = { ...createEmptyNotebookPage(pageIndex), notebookId };
    transaction.objectStore(PAGE_STORE).put(page);
    pages.push(page);
  }

  await waitForSave(transaction);
  return { ...summary, pages };
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
