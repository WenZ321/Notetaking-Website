import type { Fragment } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import { DOMSerializer } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import "./MovedTextColumnPreview.css";
import { dispatchChange } from "@/tiptap/TransactionBehavior";

// While a resize is past the buffer: the text column it will move, and
// where that text will go once the resize is let go
export type MovedTextColumnPreviewState = {
  from: number; // where the moved text column starts
  to: number; // where it ends
  moveTo: number; // where its text will go
  content: Fragment | null; // the text that moves, or null when it's empty
  joinedLine: { from: number; to: number } | null; // the other text's line the moved text joins, hidden since the ghost shows it joined
} | null;

const movedTextColumnPreviewPluginKey =
  new PluginKey<MovedTextColumnPreviewState>("movedTextColumnPreview");

// Saves a new preview, or clears it with null, without adding a step to undo
export function setMovedTextColumnPreview(
  view: EditorView,
  preview: MovedTextColumnPreviewState,
) {
  dispatchChange(
    view,
    view.state.tr.setMeta(movedTextColumnPreviewPluginKey, preview),
    "skipUndo",
  );
}

// A faded copy of the text that will move, drawn where it will end up
function createGhost(view: EditorView, content: Fragment) {
  const ghost = document.createElement("div");
  ghost.className = "resize-text-ghost";
  const serializer = DOMSerializer.fromSchema(view.state.schema);

  content.forEach((node) => {
    const line = serializer.serializeNode(node);

    // an empty line has no height on its own, so it gets a line break the
    // same way the editor gives one to empty lines
    if (node.isTextblock && node.content.size === 0) {
      line.appendChild(document.createElement("br"));
    }
    ghost.appendChild(line);
  });
  return ghost;
}

// Hides the text column a resize will move and shows a ghost of it where it
// will go, so the result is clear before letting go
export function createMovedTextColumnPreviewPlugin(): Plugin {
  return new Plugin<MovedTextColumnPreviewState>({
    key: movedTextColumnPreviewPluginKey,

    // The plugin's memory: the preview to show, or null
    state: {
      init: () => null,
      apply: (tr, preview) => {
        const meta = tr.getMeta(movedTextColumnPreviewPluginKey) as
          MovedTextColumnPreviewState | undefined;
        if (meta !== undefined) return meta;
        if (!preview || !tr.docChanged) return preview;

        // the block's size changes while dragging, so positions follow along
        const { joinedLine } = preview;
        return {
          ...preview,
          from: tr.mapping.map(preview.from),
          to: tr.mapping.map(preview.to),
          moveTo: tr.mapping.map(preview.moveTo),
          joinedLine: joinedLine && {
            from: tr.mapping.map(joinedLine.from),
            to: tr.mapping.map(joinedLine.to),
          },
        };
      },
    },

    props: {
      decorations: (state) => {
        const preview = movedTextColumnPreviewPluginKey.getState(state);
        if (!preview) return null;

        const { from, to, moveTo, content, joinedLine } = preview;
        const decorations = [
          Decoration.node(from, to, { class: "resize-text-column-moving" }),
        ];
        if (joinedLine) {
          decorations.push(
            Decoration.node(joinedLine.from, joinedLine.to, {
              class: "resize-line-joined",
            }),
          );
        }
        if (content) {
          decorations.push(
            Decoration.widget(moveTo, (view) => createGhost(view, content), {
              key: "resize-text-ghost",
            }),
          );
        }
        return DecorationSet.create(state.doc, decorations);
      },
    },
  });
}
