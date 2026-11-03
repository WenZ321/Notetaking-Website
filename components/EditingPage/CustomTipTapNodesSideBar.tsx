import type { Editor } from "@tiptap/core";
import type { ToolbarFormatState } from "@/types/TextFormatting";
import type { NotebookPaperType } from "@/types/Notebook";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DefaultTextFormatState } from "@/constants/TextFormattingConstants";
import "./CustomTipTapNodesSideBar.css";

type CustomTipTapNodesSideBarProps = {
  editor: Editor | null;
  paperType: NotebookPaperType;
  textFormatState: ToolbarFormatState;
};

// Where this browser remembers whether the panel was hidden
const HIDDEN_KEY = "insert-panel-hidden";

// The browser can refuse saved settings, then the panel just starts shown
function readIsHidden() {
  try {
    return localStorage.getItem(HIDDEN_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * A panel beside the page with buttons for inserting custom TipTap nodes into the editor.
 * Will make it draggable blocks in the future
 */
export function CustomTipTapNodesSideBar({
  editor,
  paperType,
  textFormatState,
}: CustomTipTapNodesSideBarProps) {
  const [isHidden, setIsHidden] = useState(readIsHidden);

  // Slides the panel off to the right or back, remembering it for next time
  const handleToggle = () => {
    setIsHidden(!isHidden);
    try {
      localStorage.setItem(HIDDEN_KEY, String(!isHidden));
    } catch {
      // not remembered, but it still slides
    }
  };

  return (
    <aside className="editing-page-nodes-sidebar" data-hidden={isHidden}>
      <button
        className="editing-page-nodes-sidebar-toggle"
        aria-label={isHidden ? "Show insert panel" : "Hide insert panel"}
        aria-expanded={!isHidden}
        onClick={handleToggle}
      >
        {isHidden ? <ChevronLeft /> : <ChevronRight />}
      </button>

      {/* Out of reach while hidden, so tabbing skips its buttons */}
      <div className="editing-page-nodes-sidebar-list" inert={isHidden}>
        <h2 className="editing-page-nodes-sidebar-heading">Insert</h2>
        <div className="editing-page-nodes-sidebar-tiles">
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
            onClick={() =>
              editor?.chain().focus().insertMathBlock({ paperType }).run()
            }
          >
            Block Math
          </button>
          <button
            className="editing-page-nodes-sidebar-button"
            onClick={() =>
              editor?.chain().focus().insertMatrixBlock({ paperType }).run()
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
        </div>
      </div>
    </aside>
  );
}
