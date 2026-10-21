import type { MatrixBlockAttrs } from "./MatrixBlockType";
import { MatrixBlockPreview } from "./MatrixBlockPreview";
import { MatrixBlockEditor } from "./MatrixBlockEditor";
import { CreateReactNodeView } from "../SharedNodeParts/NodeFactory/ReactNodeViewFactory";

export const MatrixBlockView = CreateReactNodeView<MatrixBlockAttrs>({
  dataType: "matrix-block",
  ViewComponent: MatrixBlockPreview,
  EditorComponent: MatrixBlockEditor,
  hasPreview: true,
  wrapperTag: "div",
});
