import type { DiagramBlockAttrs } from "./DiagramBlockType";
import { DiagramBlockEditor } from "./DiagramBlockEditor";
import { DiagramBlockPreview } from "./DiagramBlockPreview";
import { CreateReactNodeView } from "../SharedNodeParts/NodeFactory/ReactNodeViewFactory";

/**
 * Creates a react node component for the diagram block
 */
export const DiagramBlockView = CreateReactNodeView<DiagramBlockAttrs>({
  dataType: "diagram-block",
  ViewComponent: DiagramBlockPreview,
  EditorComponent: DiagramBlockEditor,
  resizable: true,
  wrapperTag: "div",
});
