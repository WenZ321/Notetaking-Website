import type { MatrixBlockAttrs } from "./MatrixBlockType";
import { MatrixBlockPreview } from "./MatrixBlockPreview";
import { MatrixBlockEditor } from "./MatrixBlockEditor";
import { CreateReactNodeView } from "../NodeFactory/ReactNodeViewFactory";

export const MatrixBlockView = CreateReactNodeView<MatrixBlockAttrs>({
  dataType: "matrix-block",
  ViewComponent: MatrixBlockPreview,
  EditorComponent: MatrixBlockEditor,
  resizable: false,
  wrapperTag: "div",
});
