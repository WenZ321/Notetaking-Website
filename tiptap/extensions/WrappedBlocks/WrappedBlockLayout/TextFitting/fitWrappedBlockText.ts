import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import { Fragment } from "@tiptap/pm/model";
import { isTextColumn } from "../arrangeWrappedBlocks";
import { getColumnPos } from "./getColumnPos";
import { measureWrappedBlockBounds } from "./measureWrappedBlockBounds";
import { findTextCut } from "./findTextCut";
import { splitColumnText } from "./splitColumnText";

// A wrapped block whose text was cut to its height, and the lines that no longer fit
export type FittedWrappedBlock = {
  above: ProseMirrorNode[];
  wrappedBlock: ProseMirrorNode;
  below: ProseMirrorNode[];
};

/**
 * Cuts a wrapped block's text so no text column reaches past the bottom of its
 * blocks, using where the text sits on the page now. Text on the left keeps
 * its last lines and sends the rest above. Other text keeps its first
 * lines and sends the rest below
 * @param view The editor
 * @param wrappedBlockPos Where the wrapped block starts, already drawn on the page
 * @returns The cut wrapped block and the lines that left it, or null when it fits
 */
export function fitWrappedBlockText(
  view: EditorView,
  wrappedBlockPos: number,
): FittedWrappedBlock | null {
  const wrappedBlock = view.state.doc.nodeAt(wrappedBlockPos);
  const bounds = measureWrappedBlockBounds(view, wrappedBlockPos);
  if (!wrappedBlock || !bounds) return null;

  const above: ProseMirrorNode[] = [];
  const below: ProseMirrorNode[] = [];
  let isChanged = false;
  const columns = wrappedBlock.content.content.map((column, index) => {
    if (!isTextColumn(column)) return column;

    const keep = index === 0 ? "last" : "first";
    const cut = findTextCut(
      view,
      getColumnPos(wrappedBlockPos, wrappedBlock, index),
      column,
      keep,
      bounds.top,
      bounds.bottom,
    );
    if (cut === null) return column;

    isChanged = true;
    const [before, after] = splitColumnText(column.content, cut);
    const kept = keep === "first" ? before : after;
    const leaving = keep === "first" ? after : before;
    if (keep === "first") below.push(...leaving.content);
    else above.push(...leaving.content);

    // a column always holds at least one line
    const emptyLine = column.type.schema.nodes.paragraph.create();
    return column.copy(kept.size ? kept : Fragment.from(emptyLine));
  });

  if (!isChanged) return null;
  return {
    above,
    wrappedBlock: wrappedBlock.copy(Fragment.fromArray(columns)),
    below,
  };
}
