import type { Editor } from "@tiptap/core";
import type { TextFormatState } from "@/types/textFormatting";
import "./CustomTipTapNodesSideBar.css";

type CustomTipTapNodesSideBarProps = {
  editor: Editor | null;
  textFormatState: TextFormatState;
};

/**
 * A sidebar component that provides buttons for inserting custom TipTap nodes into the editor.
 * Will make it draggable blocks in the future
 */
export function CustomTipTapNodesSideBar({
  editor,
  textFormatState,
}: CustomTipTapNodesSideBarProps) {
  return (
    <aside className="editing-page-nodes-sidebar">
      <button
        className="editing-page-nodes-sidebar-button"
        onClick={() => {
          editor?.chain().focus().insertDiagramBlock().run();
        }}
      >
        Diagram
      </button>
      <button
        className="editing-page-nodes-sidebar-button"
        onClick={() =>
          // matches the text it's typed into
          editor
            ?.chain()
            .focus()
            .insertMathInline({
              fontSize: textFormatState.fontSize,
              textColor: textFormatState.textColor,
            })
            .run()
        }
      >
        Inline Math
      </button>
      <button
        className="editing-page-nodes-sidebar-button"
        onClick={() => editor?.chain().focus().insertMathBlock().run()}
      >
        Block Math
      </button>
      <button
        className="editing-page-nodes-sidebar-button"
        onClick={() => editor?.chain().focus().insertMatrixBlock(2, 2).run()}
      >
        Matrix
      </button>
      <button
        className="editing-page-nodes-sidebar-button"
        onClick={() => editor?.chain().focus().insertChemBlock().run()}
      >
        Chem Equation
      </button>
    </aside>
  );
}
