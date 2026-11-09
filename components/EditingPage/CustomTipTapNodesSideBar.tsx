import type { Editor } from "@tiptap/core";
import type { ToolbarFormatState } from "@/types/TextFormatting";
import type { NotebookPaperType } from "@/types/Notebook";
import type { DragEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DefaultTextFormatState } from "@/constants/TextFormattingConstants";
import { createStartingBlock } from "@/tiptap/nodes/SharedNodeParts/NodeFactory/ReactNodeFactory";
import {
  endDrag,
  startPanelDrag,
} from "@/tiptap/extensions/BlockDragAndDrop/DragState";
import { hideLiveDropPreview } from "@/tiptap/extensions/BlockDragAndDrop/LivePreview";
import "./CustomTipTapNodesSideBar.css";

type CustomTipTapNodesSideBarProps = {
  editor: Editor | null;
  paperType: NotebookPaperType;
  textFormatState: ToolbarFormatState;
  isHidden: boolean;
  onToggle: () => void;
};

/**
 * Lets a block's insert button also be dragged onto the page, as a new
 * block of that type
 * @param editor The editor
 * @param paperType The page's paper
 * @param name The block's node type name, e.g. "DiagramBlock"
 */
function getBlockDragProps(
  editor: Editor | null,
  paperType: NotebookPaperType,
  name: string,
) {
  return {
    draggable: editor !== null,
    onDragStart: (event: DragEvent<HTMLButtonElement>) => {
      if (!editor) return;
      // some browsers only start a drag that carries data
      event.dataTransfer.setData("text/plain", "");
      event.dataTransfer.effectAllowed = "copy";
      startPanelDrag(editor.view, createStartingBlock(editor, name, paperType));
    },
    // the drag ends on the button, not the page, so it's cleared here.
    // After a drop there's nothing left to clear
    onDragEnd: () => {
      if (!editor) return;
      hideLiveDropPreview(editor.view);
      endDrag(editor.view);
    },
  };
}

/**
 * A panel beside the page with buttons for inserting custom TipTap nodes
 * into the editor. Block buttons can also be dragged onto the page
 */
export function CustomTipTapNodesSideBar({
  editor,
  paperType,
  textFormatState,
  isHidden,
  onToggle,
}: CustomTipTapNodesSideBarProps) {
  return (
    <aside className="editing-page-nodes-sidebar" data-hidden={isHidden}>
      <button
        className="editing-page-nodes-sidebar-toggle"
        aria-label={isHidden ? "Show insert panel" : "Hide insert panel"}
        aria-expanded={!isHidden}
        onClick={onToggle}
      >
        {isHidden ? <ChevronLeft /> : <ChevronRight />}
      </button>

      {/* Out of reach while hidden, so tabbing skips its buttons */}
      <div className="editing-page-nodes-sidebar-list" inert={isHidden}>
        <h2 className="editing-page-nodes-sidebar-heading">Insert</h2>
        <div className="editing-page-nodes-sidebar-tiles">
          <button
            className="editing-page-nodes-sidebar-button"
            {...getBlockDragProps(editor, paperType, "DiagramBlock")}
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
                      textFormatState.fontSize ??
                      DefaultTextFormatState.fontSize,
                    textColor:
                      textFormatState.textColor ??
                      DefaultTextFormatState.textColor,
                  },
                })
                .run()
            }
          >
            Inline Math
          </button>
          <button
            className="editing-page-nodes-sidebar-button"
            {...getBlockDragProps(editor, paperType, "MathBlock")}
            onClick={() =>
              editor?.chain().focus().insertMathBlock({ paperType }).run()
            }
          >
            Block Math
          </button>
          <button
            className="editing-page-nodes-sidebar-button"
            {...getBlockDragProps(editor, paperType, "MatrixBlock")}
            onClick={() =>
              editor?.chain().focus().insertMatrixBlock({ paperType }).run()
            }
          >
            Matrix
          </button>
          <button
            className="editing-page-nodes-sidebar-button"
            {...getBlockDragProps(editor, paperType, "ChemBlock")}
            onClick={() =>
              editor?.chain().focus().insertChemBlock({ paperType }).run()
            }
          >
            Chem Equation
          </button>
          <button
            className="editing-page-nodes-sidebar-button"
            {...getBlockDragProps(editor, paperType, "CodeBlock")}
            onClick={() =>
              editor?.chain().focus().insertCodeBlock({ paperType }).run()
            }
          >
            Code
          </button>
        </div>
      </div>
    </aside>
  );
}
