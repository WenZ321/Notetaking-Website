import type { MathAttrs } from "../MathType";
import { MathBlockPreview } from "./MathBlockPreview";
import { MathEditor } from "../MathEditor";
import { CreateReactNodeView } from "../../ReactNodeViewFactory";

export const MathBlockView = CreateReactNodeView<MathAttrs>({
  dataType: "math-block",
  ViewComponent: MathBlockPreview,
  EditorComponent: MathEditor,
  resizable: false,
  wrapperTag: "div",
});
