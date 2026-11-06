import type { Editor } from "@tiptap/core";
import type { Plugin, Transaction } from "@tiptap/pm/state";
import type { TopLevelNode } from "@/tiptap/nodes/WrappedNodeTypes";
import { EditorState } from "@tiptap/pm/state";
import { history } from "@tiptap/pm/history";
import { schema } from "./TestPage";

// A stand-in for the editor, holding these rows and lines, with undo. It
// draws nothing, so blocks' contents need no room
export function makeEditor(
  nodes: TopLevelNode[],
  plugins: Plugin[] = [],
): Editor {
  const view = {
    state: EditorState.create({
      doc: schema.nodes.doc.create(null, nodes),
      plugins: [history(), ...plugins],
    }),
    dispatch: (tr: Transaction) => {
      view.state = view.state.apply(tr);
    },
    nodeDOM: () => null,
  };
  return {
    view,
    get state() {
      return view.state;
    },
  } as unknown as Editor;
}
