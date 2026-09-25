import type { EditorComponentProps } from "../../NodeFactory/ReactNodeViewFactory";
import type { ChemAttrs } from "../ChemType";

// Placeholder - replaced with the real add/remove-slot editor in a later phase.
export function ChemBlockEditor({
  closeEditor,
}: EditorComponentProps<ChemAttrs>) {
  return (
    <div>
      <button onClick={closeEditor}>Close</button>
    </div>
  );
}
