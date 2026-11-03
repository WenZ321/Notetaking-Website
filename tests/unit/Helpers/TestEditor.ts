import type { Editor } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import type { TopLevelNode } from "@/tiptap/nodes/WrappedNodeTypes";
import type { ResizableAttrs } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/NodeResizeLogic/UseBlockResize";
import { EditorState } from "@tiptap/pm/state";
import { history } from "@tiptap/pm/history";
import { schema } from "./TestPage";

// A stand-in for the editor, holding these rows and lines, with undo. It
// draws nothing, so blocks' contents need no room
export function makeEditor(nodes: TopLevelNode[]): Editor {
  const view = {
    state: EditorState.create({
      doc: schema.nodes.doc.create(null, nodes),
      plugins: [history()],
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

// Changes a block's attributes the way its node view does
export function makeUpdateAttributes(editor: Editor, blockPos: number) {
  return (attrs: Partial<ResizableAttrs>) => {
    const block = editor.state.doc.nodeAt(blockPos)!;
    editor.view.dispatch(
      editor.state.tr.setNodeMarkup(blockPos, undefined, {
        ...block.attrs,
        ...attrs,
      }),
    );
  };
}
