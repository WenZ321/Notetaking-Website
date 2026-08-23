import type { Editor } from "@tiptap/core";

type Props = {
  editor: Editor | null;
};

export default function SideBar({ editor }: Props) {
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
