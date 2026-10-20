import type { CodeBlockAttrs } from "./CodeBlockType";
import { CodeBlockEditor } from "./CodeBlockEditor";
import { CreateReactNodeView } from "../SharedNodeParts/NodeFactory/ReactNodeViewFactory";

// Code is always edited right on the page, so there's no preview to show
export const CodeBlockView = CreateReactNodeView<CodeBlockAttrs>({
  dataType: "code-block",
  EditorComponent: CodeBlockEditor,
  resizable: true,
  hasPreview: false,
  wrapperTag: "div",
});
