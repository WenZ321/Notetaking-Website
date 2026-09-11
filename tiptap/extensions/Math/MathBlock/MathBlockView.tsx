import type { MathAttrs } from "../MathType";
import { MathBlockPreview } from "./MathBlockPreview";
import { MathBlockEditor } from "./MathBlockEditor";
import { CreateReactNodeView } from "../../ReactNodeViewFactory";

export const MathBlockView = CreateReactNodeView<MathAttrs>({
  dataType: "math-block",
  ViewComponent: MathBlockPreview,
  EditorComponent: MathBlockEditor,
  resizable: false,
  wrapperTag: "div",
});
