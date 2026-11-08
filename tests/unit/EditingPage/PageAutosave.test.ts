import "fake-indexeddb/auto";
import type { Editor } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import type { NotebookState } from "@/types/Notebook";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { EditorState } from "@tiptap/pm/state";
import {
  AUTOSAVE_DELAY_MS,
  watchPageSaves,
} from "@/components/EditingPage/UsePageAutosave";
import { createNotebook, getNotebook } from "@/data/NotebookDB";
import {
  createEmptyNotebookPage,
  createNotebookCover,
} from "@/data/CreateNotebookPages";
import { LIVE_DROP_PREVIEW_META } from "@/tiptap/extensions/BlockDragAndDrop/DragState";
import { makeLine, schema } from "../Helpers/TestPage";

// A notebook with the cover and page 1, not saved yet
function makeNotebook(): NotebookState {
  return {
    id: crypto.randomUUID(),
    title: "Test",
    coverStyle: "red",
    paperType: "lined",
    pages: [createNotebookCover(), createEmptyNotebookPage(1)],
  };
}

// A stand-in for the page's editor, which can be typed into
function makeEditor() {
  const listeners = new Set<(event: { transaction: Transaction }) => void>();
  const editor = {
    isDestroyed: false,
    state: EditorState.create({
      doc: schema.nodes.doc.create(null, makeLine("")),
    }),
    on: (_event: string, listener: (event: { transaction: Transaction }) => void) =>
      listeners.add(listener),
    off: (_event: string, listener: (event: { transaction: Transaction }) => void) =>
      listeners.delete(listener),
  };

  // Types text at the start of the page, or shows a drop preview
  const type = (text: string, isPreview = false) => {
    const tr = editor.state.tr.insertText(text, 1);
    if (isPreview) tr.setMeta(LIVE_DROP_PREVIEW_META, true);
    editor.state = editor.state.apply(tr);
    listeners.forEach((listener) => listener({ transaction: tr }));
  };
  return { editor: editor as unknown as Editor, type };
}

// The text saved on page 1
async function readSavedText(notebookId: string) {
  const notebook = await getNotebook(notebookId);
  return JSON.stringify(notebook?.pages[1].content).match(/"text":"([^"]*)"/)?.[1];
}

// The browser tab, which can be hidden
let visibility: "visible" | "hidden";
const tab = new EventTarget();
function hideTab() {
  visibility = "hidden";
  tab.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  visibility = "visible";
  vi.stubGlobal("document", {
    get visibilityState() {
      return visibility;
    },
    addEventListener: tab.addEventListener.bind(tab),
    removeEventListener: tab.removeEventListener.bind(tab),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("watchPageSaves", () => {
  test("saves once typing stops, not on every key", async () => {
    const notebook = makeNotebook();
    await createNotebook(notebook);
    const { editor, type } = makeEditor();
    watchPageSaves(editor, notebook.id, notebook.pages[1].id);

    type("a");
    type("b");
    expect(await readSavedText(notebook.id)).toBeUndefined();

    await new Promise((resolve) => setTimeout(resolve, AUTOSAVE_DELAY_MS));
    await vi.waitFor(async () =>
      expect(await readSavedText(notebook.id)).toBe("ba"),
    );
  });

  test("saves right away when the tab is hidden", async () => {
    const notebook = makeNotebook();
    await createNotebook(notebook);
    const { editor, type } = makeEditor();
    watchPageSaves(editor, notebook.id, notebook.pages[1].id);

    type("a");
    hideTab();

    await vi.waitFor(async () =>
      expect(await readSavedText(notebook.id)).toBe("a"),
    );
  });

  test("saves what's left when it stops watching, like leaving the page", async () => {
    const notebook = makeNotebook();
    await createNotebook(notebook);
    const { editor, type } = makeEditor();
    const stop = watchPageSaves(editor, notebook.id, notebook.pages[1].id);

    type("a");
    stop();

    await vi.waitFor(async () =>
      expect(await readSavedText(notebook.id)).toBe("a"),
    );
  });

  test("a drop preview alone isn't saved", async () => {
    const notebook = makeNotebook();
    await createNotebook(notebook);
    const { editor, type } = makeEditor();
    const stop = watchPageSaves(editor, notebook.id, notebook.pages[1].id);

    type("a");
    hideTab();
    type("b", true);
    stop();

    // reads are answered after every save asked for before them
    expect(await readSavedText(notebook.id)).toBe("a");
  });

  test("a save that fails is tried again the next time", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    // the page isn't saved yet, so saving into it fails
    const notebook = makeNotebook();
    const { editor, type } = makeEditor();
    watchPageSaves(editor, notebook.id, notebook.pages[1].id);

    type("a");
    hideTab();
    await vi.waitFor(() => expect(console.error).toHaveBeenCalled());

    // once the page exists, hiding the tab again saves with no new typing
    await createNotebook(notebook);
    hideTab();

    await vi.waitFor(async () =>
      expect(await readSavedText(notebook.id)).toBe("a"),
    );
  });
});
