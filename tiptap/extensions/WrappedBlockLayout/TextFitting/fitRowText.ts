import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import { Fragment } from "@tiptap/pm/model";
import { isTextColumn } from "../arrangeWrappedBlocks";
import { getColumnPos } from "./getColumnPos";
import { measureRowBounds } from "./measureRowBounds";
import { findTextCut } from "./findTextCut";
import { splitColumnText } from "./splitColumnText";

// A row whose text was cut to its height, and the lines that no longer fit
export type FittedRow = {
  above: ProseMirrorNode[];
  row: ProseMirrorNode;
  below: ProseMirrorNode[];
};

/**
 * Cuts a row's text so no text column reaches past the bottom of its
 * blocks, using where the text sits on the page now. Text on the left keeps
 * its last lines and sends the rest above. Other text keeps its first
 * lines and sends the rest below
 * @param view The editor
 * @param rowPos Where the row starts, already drawn on the page
 * @returns The cut row and the lines that left it, or null when it fits
 */
export function fitRowText(
  view: EditorView,
  rowPos: number,
): FittedRow | null {
  const row = view.state.doc.nodeAt(rowPos);
  const bounds = measureRowBounds(view, rowPos);
  if (!row || !bounds) return null;

  const above: ProseMirrorNode[] = [];
  const below: ProseMirrorNode[] = [];
  let isChanged = false;
  const columns = row.content.content.map((column, index) => {
    if (!isTextColumn(column)) return column;

    const keep = index === 0 ? "last" : "first";
    const cut = findTextCut(
      view,
      getColumnPos(rowPos, row, index),
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
  return { above, row: row.copy(Fragment.fromArray(columns)), below };
}
