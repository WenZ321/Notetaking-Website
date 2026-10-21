import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

// True when a text column holds only one empty line, so it has nothing
// worth keeping
export function isEmptyTextColumn(column: ProseMirrorNode): boolean {
  const line = column.firstChild;
  return column.childCount === 1 && !!line?.isTextblock && !line.content.size;
}
