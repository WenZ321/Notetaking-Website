import { CreateReactNodeView } from "../ReactNodeViewFactory";
import DiagramBlockEditor from "./DiagramBlockEditor";
import DiagramBlockPreview from "./DiagramBlockPreview";
import type { DiagramBlockAttrs } from "./DiagramBlockType";

/**
 * Creates a react node component for the diagram block
 */
const DiagramBlockView = CreateReactNodeView<DiagramBlockAttrs>({
  dataType: "diagram-block",
  ViewComponent: DiagramBlockPreview,
  EditorComponent: DiagramBlockEditor,
  resizable: true,
  wrapperTag: "div",
});

export default DiagramBlockView;
