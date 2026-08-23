import TextEditor from "./TextEditor";
import type { Editor } from "@tiptap/core";

type Props = {
  width: number;
  height: number;
  editable: boolean;
  onActivate?: (editor: Editor) => void;
};

export default function Page({ editable, width, height, onActivate }: Props) {
  return (
    <TextEditor
      editable={editable}
      width={width}
      height={height}
      onActivate={onActivate}
    />
  );
}
