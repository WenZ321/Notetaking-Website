import type { TopLevelNode } from "@/tiptap/nodes/WrappedNodeTypes";
import { Fragment, Slice } from "@tiptap/pm/model";

/**
 * Makes every pasted paragraph a new line, since pasted text is new and was
 * never cut off from the line above it. Pasted blocks are kept as they are
 * @param pasted The pasted text
 * @returns The pasted text with every paragraph a new line
 */
export function makePastedTextNewLines(pasted: Slice): Slice {
  const items: TopLevelNode[] = [];
  pasted.content.forEach((item) => {
    const isCutOffLine = item.isTextblock && item.attrs.isNewLine === false;
    if (isCutOffLine) {
      items.push(
        item.type.create(
          { ...item.attrs, isNewLine: true },
          item.content,
          item.marks,
        ),
      );
    } else {
      items.push(item);
    }
  });

  return new Slice(Fragment.fromArray(items), pasted.openStart, pasted.openEnd);
}
