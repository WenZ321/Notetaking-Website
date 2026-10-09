import type { EditorView } from "@tiptap/pm/view";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { getDraggedBlock } from "../BlockDragAndDrop/dragState";
import "./DropPreview.css";

const dropPreviewPluginKey = new PluginKey("dropPreview");

// Puts the outline at the drag's saved target, the same one the drop uses,
// or takes it away when there's no target
function drawOutline(view: EditorView, outline: HTMLDivElement) {
  const dragged = getDraggedBlock(view.state);
  const target = dragged?.target;
  const page = view.dom.offsetParent;

  if (!dragged || !target || !(page instanceof HTMLElement)) {
    outline.remove();
    return;
  }

  // rects include any page scaling, so it's divided back out
  const pageRect = page.getBoundingClientRect();
  const scale = pageRect.width / page.offsetWidth || 1;

  outline.style.setProperty(
    "--drop-preview-left",
    `${(target.left - pageRect.left) / scale}px`,
  );
  outline.style.setProperty(
    "--drop-preview-top",
    `${(target.top - pageRect.top) / scale}px`,
  );
  outline.style.setProperty("--drop-preview-width", `${dragged.width}px`);
  outline.style.setProperty("--drop-preview-height", `${dragged.height}px`);

  if (!outline.isConnected) page.appendChild(outline);
}

// Shows a dashed outline of the dragged block where it will land. It only
// draws the drag's target, it never decides one
export function createDropPreviewPlugin(): Plugin {
  return new Plugin({
    key: dropPreviewPluginKey,

    // Redraws whenever the editor updates, like when the target changes.
    // Made here since the page doesn't exist before the editor is on screen
    view: (editorView) => {
      const outline = document.createElement("div");
      outline.className = "drop-preview-outline";
      drawOutline(editorView, outline);

      return {
        update: (view) => drawOutline(view, outline),
        destroy: () => outline.remove(),
      };
    },
  });
}
