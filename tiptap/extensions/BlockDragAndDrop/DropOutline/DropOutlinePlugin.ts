import type { EditorView } from "@tiptap/pm/view";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { getDragWithBlock } from "../DragState";
import "./DropOutline.css";

const dropOutlinePluginKey = new PluginKey("dropOutline");

// Puts the outline at the drag's saved target, the same one the drop uses,
// or takes it away when there's no target. A drop into another wrapped block shows
// on the page itself, so it needs no outline
function drawOutline(view: EditorView, outline: HTMLDivElement) {
  const dragged = getDragWithBlock(view.state);
  const target = dragged?.target;
  const page = view.dom.offsetParent;

  if (
    !dragged ||
    !target ||
    target.otherWrappedBlockDrop ||
    !(page instanceof HTMLElement)
  ) {
    outline.remove();
    return;
  }

  // rects include any page scaling, so it's divided back out
  const pageRect = page.getBoundingClientRect();
  const scale = pageRect.width / page.offsetWidth || 1;

  outline.style.setProperty(
    "--drop-outline-left",
    `${(target.left - pageRect.left) / scale}px`,
  );
  outline.style.setProperty(
    "--drop-outline-top",
    `${(target.top - pageRect.top) / scale}px`,
  );
  outline.style.setProperty("--drop-outline-width", `${dragged.width}px`);
  outline.style.setProperty("--drop-outline-height", `${dragged.height}px`);

  if (!outline.isConnected) page.appendChild(outline);
}

// Shows a dashed outline of the dragged block where it will land. It only
// draws the drag's target, it never decides one
export function createDropOutlinePlugin(): Plugin {
  return new Plugin({
    key: dropOutlinePluginKey,

    // Redraws whenever the editor updates, like when the target changes.
    // Made here since the page doesn't exist before the editor is on screen
    view: (editorView) => {
      const outline = document.createElement("div");
      outline.className = "drop-outline";
      drawOutline(editorView, outline);

      return {
        update: (view) => drawOutline(view, outline),
        destroy: () => outline.remove(),
      };
    },
  });
}
