import type { EditorComponentProps } from "../NodeFactory/ReactNodeViewFactory";
import type { MatrixBlockAttrs } from "./MatrixBlockType";

// Placeholder - replaced with the real per-cell math-field grid in a later phase.
export function MatrixBlockEditor({
  closeEditor,
}: EditorComponentProps<MatrixBlockAttrs>) {
  return (
    <div>
      <button onClick={closeEditor}>Close</button>
    </div>
  );
}
