import type { Editor } from "@tiptap/core";

type CustomTipTapNodesSideBarProps = {
  editor: Editor | null;
};

/**
 * A sidebar component that provides buttons for inserting custom TipTap nodes into the editor.
 * Will make it draggable blocks in the future
 */
export default function CustomTipTapNodesSideBar({
  editor,
}: CustomTipTapNodesSideBarProps) {
  return (
    <div>
      <button
        onClick={() => {
          editor?.chain().focus().insertDiagramBlock().run();
        }}
      >
        Diagram
      </button>
      <button
        onClick={() =>
          editor?.chain().focus().insertInlineMath({ latex: "x" }).run()
        }
      >
        Inline Math
      </button>
      <button onClick={() => editor?.chain().focus().insertMathBlock().run()}>
        Block Math
      </button>
    </div>
  );
}
