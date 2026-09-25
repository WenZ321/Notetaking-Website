import type { ChemAttrs } from "../ChemType";
import { ChemBlockPreview } from "./ChemBlockPreview";
import { ChemBlockEditor } from "./ChemBlockEditor";
import { CreateReactNodeView } from "../../NodeFactory/ReactNodeViewFactory";

export const ChemBlockView = CreateReactNodeView<ChemAttrs>({
  dataType: "chem-block",
  ViewComponent: ChemBlockPreview,
  EditorComponent: ChemBlockEditor,
  resizable: false,
  wrapperTag: "div",
});
