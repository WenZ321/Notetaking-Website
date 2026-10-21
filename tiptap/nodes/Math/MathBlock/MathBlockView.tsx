import type { MathBlockAttrs } from "../MathType";
import { MathBlockPreview } from "./MathBlockPreview";
import { MathBlockEditor } from "./MathBlockEditor";
import { CreateReactNodeView } from "../../SharedNodeParts/NodeFactory/ReactNodeViewFactory";

export const MathBlockView = CreateReactNodeView<MathBlockAttrs>({
  dataType: "math-block",
  ViewComponent: MathBlockPreview,
  EditorComponent: MathBlockEditor,
  hasPreview: true,
  wrapperTag: "div",
});
