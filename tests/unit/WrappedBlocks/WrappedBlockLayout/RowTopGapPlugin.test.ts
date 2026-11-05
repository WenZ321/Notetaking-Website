import type { EditorView } from "@tiptap/pm/view";
import { describe, expect, it, vi } from "vitest";
import { EditorState } from "@tiptap/pm/state";
import { createRowTopGapPlugin } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockLayout/RowTopGapPlugin";
import { makeBlock, makeLine, makeRow, schema } from "../../Helpers/TestPage";

describe("createRowTopGapPlugin", () => {
  it("waits for the next frame when a row isn't drawn yet", () => {
    const requestFrame = vi.fn();
    vi.stubGlobal("requestAnimationFrame", requestFrame);
    vi.stubGlobal("HTMLElement", class {});

    const plugin = createRowTopGapPlugin(24);
    const doc = schema.nodes.doc.create(null, [
      makeRow("left", [makeBlock(200)]),
      makeLine(""),
    ]);
    const state = EditorState.create({ doc, plugins: [plugin] });
    const view = {
      isDestroyed: false,
      state,
      nodeDOM: () => null,
    } as unknown as EditorView;

    plugin.spec.view!(view).update!(view, state);
    expect(requestFrame).toHaveBeenCalledOnce();

    vi.unstubAllGlobals();
  });
});
