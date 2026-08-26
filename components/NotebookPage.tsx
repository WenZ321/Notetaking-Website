import TiptapTextEditor from "./TiptapTextEditor";
import type { Editor } from "@tiptap/core";

type Props = {
  width: number;
  height: number;
  editable: boolean;
  onActivate?: (editor: Editor) => void;
};
/**
 * A representation of one notebook page
 * Will need to add a preview and editing mode, and a way to switch between the two
 */
export default function NotebookPage({
  editable,
  width,
  height,
  onActivate,
}: Props) {
  return (
    <TiptapTextEditor
      editable={editable}
      width={width}
      height={height}
      onActivate={onActivate}
    />
  );
}
