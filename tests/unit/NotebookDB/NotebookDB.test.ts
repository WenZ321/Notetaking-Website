import "fake-indexeddb/auto";
import { describe, expect, test } from "vitest";
import type { NotebookState } from "@/types/Notebook";
import {
  createNotebook,
  deleteNotebookDatabase,
  ensurePagesExist,
  getNotebook,
  getNotebookPage,
  getNotebooks,
  updateNotebookPage,
  updateNotebookTitle,
} from "@/data/NotebookDB";
import {
  createEmptyNotebookPage,
  createNotebookCover,
} from "@/data/CreateNotebookPages";

// A new notebook as the app makes it, with the cover and pages 1 and 2
async function saveNewNotebook(title = "Test"): Promise<NotebookState> {
  const notebook: NotebookState = {
    id: crypto.randomUUID(),
    title,
    coverStyle: "red",
    paperType: "lined",
    pages: [
      createNotebookCover(),
      createEmptyNotebookPage(1),
      createEmptyNotebookPage(2),
    ],
  };
  await createNotebook(notebook);
  return notebook;
}

describe("ensurePagesExist", () => {
  test("adds pages numbered by where they land, and none twice", async () => {
    const { id } = await saveNewNotebook();

    await ensurePagesExist(id, 5);
    await ensurePagesExist(id, 5);

    const saved = await getNotebook(id);
    expect(saved?.pages.map((page) => page.pageNumber)).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
  });
});

describe("createNotebook", () => {
  test("a blank title is saved as Untitled Notebook", async () => {
    const { id } = await saveNewNotebook("   ");

    expect((await getNotebook(id))?.title).toBe("Untitled Notebook");
  });
});

describe("getNotebooks", () => {
  test("lists every notebook without its pages", async () => {
    const { id } = await saveNewNotebook();

    const listed = (await getNotebooks()).find((notebook) => notebook.id === id);
    expect(listed?.title).toBe("Test");
    expect(listed).not.toHaveProperty("pages");
  });
});

describe("getNotebook", () => {
  test("a notebook that was never saved is missing", async () => {
    expect(await getNotebook("not-saved")).toBeUndefined();
  });
});

describe("getNotebookPage", () => {
  test("finds a page in its own notebook", async () => {
    const notebook = await saveNewNotebook();
    const page = notebook.pages[1];

    expect((await getNotebookPage(notebook.id, page.id)).id).toBe(page.id);
  });

  test("won't hand out a page from another notebook", async () => {
    const first = await saveNewNotebook();
    const second = await saveNewNotebook();

    await expect(
      getNotebookPage(second.id, first.pages[1].id),
    ).rejects.toThrow();
  });
});

describe("updateNotebookTitle", () => {
  test("saves the new title, trimmed", async () => {
    const { id } = await saveNewNotebook();

    await updateNotebookTitle(id, "  Physics  ");

    expect((await getNotebook(id))?.title).toBe("Physics");
  });

  test("a notebook that was never saved can't be renamed", async () => {
    await expect(updateNotebookTitle("not-saved", "Physics")).rejects.toThrow();
  });
});

describe("ensurePagesExist on a missing notebook", () => {
  test("adds no pages and says so", async () => {
    await expect(ensurePagesExist("not-saved", 3)).rejects.toThrow();
  });
});

describe("updateNotebookPage", () => {
  test("saves the page's new content", async () => {
    const notebook = await saveNewNotebook();
    const page = notebook.pages[1];
    const content = { type: "doc", content: [{ type: "paragraph" }] };

    await updateNotebookPage(notebook.id, page.id, content);

    expect((await getNotebookPage(notebook.id, page.id)).content).toEqual(
      content,
    );
  });

  test("won't save a page into another notebook", async () => {
    const first = await saveNewNotebook();
    const second = await saveNewNotebook();
    const page = first.pages[1];
    const content = { type: "doc", content: [] };

    await expect(
      updateNotebookPage(second.id, page.id, content),
    ).rejects.toThrow();

    const saved = await getNotebook(first.id);
    expect(saved?.pages[1].content).toEqual(page.content);
  });
});

describe("deleteNotebookDatabase", () => {
  test("wipes every notebook, and saving works again after", async () => {
    await saveNewNotebook();

    await deleteNotebookDatabase();
    expect(await getNotebooks()).toEqual([]);

    const { id } = await saveNewNotebook();
    expect(await getNotebook(id)).toBeDefined();
  });
});
