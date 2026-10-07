import type { EditorView } from "@tiptap/pm/view";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { getDraggedBlock } from "../BlockDragAndDrop/blockDragAndDropPlugin";
import { findDropTarget } from "../BlockDragAndDrop/findDropTarget";
import "./DropPreview.css";

const dropPreviewPluginKey = new PluginKey("dropPreview");

// Shows a dashed outline of the dragged block where the drop rule says it
// will land, using the same rule as the drop itself
export function createDropPreviewPlugin(): Plugin {
  // Made once the editor is on screen, since the page doesn't exist before then
  let outline: HTMLDivElement | null = null;

  const hide = () => outline?.remove();

  const show = (view: EditorView, event: DragEvent) => {
    const dragged = getDraggedBlock(view.state);
    const target =
      dragged &&
      view.dragging &&
      findDropTarget(view, event, view.dragging.slice);
    const page = view.dom.offsetParent;

    if (!outline || !dragged || !target || !(page instanceof HTMLElement)) {
      hide();
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
  };

  return new Plugin({
    key: dropPreviewPluginKey,

    // Each one returns false so the editor still handles the drag itself
    props: {
      handleDOMEvents: {
        dragover: (view, event) => {
          show(view, event);
          return false;
        },

        // Moving between parts of the page also fires this, so it only
        // hides once the cursor leaves the editor
        dragleave: (view, event) => {
          if (!view.dom.contains(event.relatedTarget as Node | null)) hide();
          return false;
        },

        drop: () => {
          hide();
          return false;
        },

        dragend: () => {
          hide();
          return false;
        },
      },
    },

    view: () => {
      outline = document.createElement("div");
      outline.className = "drop-preview-outline";

      return { destroy: hide };
    },
  });
}
