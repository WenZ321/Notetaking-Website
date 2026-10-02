import type { ChemBlockAttrs } from "../ChemType";
import { ChemBlockPreview } from "./ChemBlockPreview";
import { ChemBlockEditor } from "./ChemBlockEditor";
import { CreateReactNodeView } from "../../SharedNodeParts/NodeFactory/ReactNodeViewFactory";

export const ChemBlockView = CreateReactNodeView<ChemBlockAttrs>({
  dataType: "chem-block",
  ViewComponent: ChemBlockPreview,
  EditorComponent: ChemBlockEditor,
  resizable: true,
  wrapperTag: "div",
});
