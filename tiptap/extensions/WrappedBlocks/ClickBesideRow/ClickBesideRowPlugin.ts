import type { EditorView } from "@tiptap/pm/view";
import { Plugin, TextSelection } from "@tiptap/pm/state";
import { getRowDom } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";

// A line of text beside a floated row, and where it's drawn
type LineBesideRow = {
  pos: number;
  rect: DOMRect;
};

/**
 * The lines of text beside the floated row a click is next to, on its text
 * side. A floated row's text is the lines after it, up to the next row,
 * that start before the row ends
 * @param view The editor
 * @param event The click
 * @returns Those lines top to bottom, or null when the click isn't beside a floated row
 */
function findLinesBesideClick(
  view: EditorView,
  event: MouseEvent,
): LineBesideRow[] | null {
  const { doc } = view.state;
  let lines: LineBesideRow[] | null = null;

  doc.forEach((node, pos, index) => {
    if (lines || node.type.name !== "WrappedBlock") return;
    if (node.attrs.wrap === "newspaper") return;

    // the click has to be within the row's height, but not on its blocks
    const rowRect = getRowDom(view, pos)?.getBoundingClientRect();
    if (!rowRect) return;
    const isBesideRow =
      event.clientY >= rowRect.top &&
      event.clientY < rowRect.bottom &&
      (event.clientX < rowRect.left || event.clientX > rowRect.right);
    if (!isBesideRow) return;

    const found: LineBesideRow[] = [];
    let linePos = pos + node.nodeSize;
    for (let i = index + 1; i < doc.childCount; i++) {
      const line = doc.child(i);
      if (line.type.name === "WrappedBlock") break;

      const lineDom = view.nodeDOM(linePos);
      const rect =
        lineDom instanceof HTMLElement ? lineDom.getBoundingClientRect() : null;
      if (!rect || rect.top >= rowRect.bottom) break;
      found.push({ pos: linePos, rect });
      linePos += line.nodeSize;
    }
    lines = found;
  });
  return lines;
}

// The space beside a floated row works like a box of text: a click anywhere
// in it puts the cursor in the row's text. Below its last line, the cursor
// goes to the spot on that line under the click. Clicks on a line itself
// are left to the browser
export function createClickBesideRowPlugin(): Plugin {
  return new Plugin({
    props: {
      handleDOMEvents: {
        mousedown: (view, event) => {
          if (event.button !== 0 || event.shiftKey) return false;

          const lines = findLinesBesideClick(view, event);
          if (!lines || lines.length === 0) return false;

          const isOnLine = lines.some(
            ({ rect }) =>
              event.clientY >= rect.top && event.clientY < rect.bottom,
          );
          if (isOnLine) return false;

          // the last line that starts above the click
          const line =
            lines.findLast(({ rect }) => rect.top <= event.clientY) ?? lines[0];
          const spot = view.posAtCoords({
            left: event.clientX,
            top: line.rect.bottom - 1,
          });
          if (!spot) return false;

          event.preventDefault();
          view.dispatch(
            view.state.tr.setSelection(
              TextSelection.create(view.state.doc, spot.pos),
            ),
          );
          view.focus();
          return true;
        },
      },
    },
  });
}
