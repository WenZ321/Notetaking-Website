import type { MathAttrs } from "../MathType";
import { MathInlinePreview } from "./MathInlinePreview";
import { MathInlineEditor } from "./MathInlineEditor";
import { CreateReactNodeView } from "../../NodeFactory/ReactNodeViewFactory";

export const MathInlineView = CreateReactNodeView<MathAttrs>({
  dataType: "math-inline",
  ViewComponent: MathInlinePreview,
  EditorComponent: MathInlineEditor,
  wrapperTag: "span",
});
