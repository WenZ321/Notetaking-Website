import { CreateReactNodeView } from "../../ReactNodeViewFactory";
import type { MathAttrs } from "../MathType";
import { MathBlockPreview } from "./MathBlockPreview";
import { MathBlockEditor } from "./MathBlockEditor";

export const MathBlockView = CreateReactNodeView<MathAttrs>({
  dataType: "math-block",
  ViewComponent: MathBlockPreview,
  EditorComponent: MathBlockEditor,
  resizable: false,
  wrapperTag: "div",
});
