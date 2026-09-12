import type { MathAttrs } from "../MathType";
import { MathBlockPreview } from "./MathBlockPreview";
import { MathBlockEditor } from "./MathBlockEditor";
import { CreateReactNodeView } from "../../ReactNodeViewFactory";

// Wires the math block's preview and editor components into one node view.
export const MathBlockView = CreateReactNodeView<MathAttrs>({
  dataType: "math-block",
  ViewComponent: MathBlockPreview,
  EditorComponent: MathBlockEditor,
  resizable: false,
  wrapperTag: "div",
});
