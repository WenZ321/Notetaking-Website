import type { Editor } from "@tiptap/core";
import type { ToolbarFormatState } from "@/types/TextFormatting";
import type { NotebookPaperType } from "@/types/Notebook";
import { DefaultTextFormatState } from "@/constants/TextFormattingConstants";
import "./CustomTipTapNodesSideBar.css";

type CustomTipTapNodesSideBarProps = {
  editor: Editor | null;
  paperType: NotebookPaperType;
  textFormatState: ToolbarFormatState;
};

/**
 * A sidebar component that provides buttons for inserting custom TipTap nodes into the editor.
 * Will make it draggable blocks in the future
 */
export function CustomTipTapNodesSideBar({
  editor,
  paperType,
  textFormatState,
}: CustomTipTapNodesSideBarProps) {
  return (
    <aside className="editing-page-nodes-sidebar">
      <button
        className="editing-page-nodes-sidebar-button"
        onClick={() => {
          editor?.chain().focus().insertDiagramBlock({ paperType }).run();
        }}
      >
        Diagram
      </button>
      <button
        className="editing-page-nodes-sidebar-button"
        onClick={() =>
          // matches the text it's typed into, or the defaults while a node
          // without these settings is selected
          editor
            ?.chain()
            .focus()
            .insertMathInline({
              toolbarValues: {
                fontSize:
                  textFormatState.fontSize ?? DefaultTextFormatState.fontSize,
                textColor:
                  textFormatState.textColor ?? DefaultTextFormatState.textColor,
              },
            })
            .run()
        }
      >
        Inline Math
      </button>
      <button
        className="editing-page-nodes-sidebar-button"
        onClick={() =>
          editor?.chain().focus().insertMathBlock({ paperType }).run()
        }
      >
        Block Math
      </button>
      <button
        className="editing-page-nodes-sidebar-button"
        onClick={() =>
          editor?.chain().focus().insertMatrixBlock(2, 2, paperType).run()
        }
      >
        Matrix
      </button>
      <button
        className="editing-page-nodes-sidebar-button"
        onClick={() =>
          editor?.chain().focus().insertChemBlock({ paperType }).run()
        }
      >
        Chem Equation
      </button>
      <button
        className="editing-page-nodes-sidebar-button"
        onClick={() =>
          editor?.chain().focus().insertCodeBlock({ paperType }).run()
        }
      >
        Code
      </button>
    </aside>
  );
}
