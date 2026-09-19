import type { MathAttrs } from "../MathType";
import { MathInlinePreview } from "./MathInlinePreview";
import { MathEditor } from "../MathEditor";
import { CreateReactNodeView } from "../../ReactNodeViewFactory";

export const MathInlineView = CreateReactNodeView<MathAttrs>({
  dataType: "math-inline",
  ViewComponent: MathInlinePreview,
  EditorComponent: MathEditor,
  resizable: false,
  wrapperTag: "span",
});
