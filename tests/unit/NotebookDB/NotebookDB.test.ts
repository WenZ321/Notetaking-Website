import "fake-indexeddb/auto";
import { describe, expect, test } from "vitest";
import type { NotebookState } from "@/types/Notebook";
import {
  createNotebook,
  ensurePagesExist,
  getNotebook,
  updateNotebookPage,
} from "@/data/NotebookDB";
import {
  createEmptyNotebookPage,
  createNotebookCover,
} from "@/data/CreateNotebookPages";

// A new notebook as the app makes it, with the cover and pages 1 and 2
async function saveNewNotebook(): Promise<NotebookState> {
  const notebook: NotebookState = {
    id: crypto.randomUUID(),
    title: "Test",
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

describe("updateNotebookPage", () => {
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
