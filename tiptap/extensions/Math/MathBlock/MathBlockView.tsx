import type { MathBlockAttrs } from "../MathType";
import { MathBlockPreview } from "./MathBlockPreview";
import { MathBlockEditor } from "./MathBlockEditor";
import { CreateReactNodeView } from "../../NodeFactory/ReactNodeViewFactory";

export const MathBlockView = CreateReactNodeView<MathBlockAttrs>({
  dataType: "math-block",
  ViewComponent: MathBlockPreview,
  EditorComponent: MathBlockEditor,
  resizable: true,
  wrapperTag: "div",
});
