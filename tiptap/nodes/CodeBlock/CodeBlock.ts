import type { CodeBlockAttrs } from "./CodeBlockType";
import type { MaxBlockSize } from "../SharedNodeParts/NodeFactory/ReactNodeFactory";
import { CodeBlockView } from "./CodeBlockView";
import { CreateReactNodeExtension } from "../SharedNodeParts/NodeFactory/ReactNodeFactory";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";

const defaultCodeAttrs: CodeBlockAttrs = {
  language: "python",
  code: "",
  width: 600,
  height: 300,
};

const codeMaxSize: MaxBlockSize = {
  maxWidth: NOTEBOOK_PAGE_WIDTH,
  maxHeight: 600,
};

export const CodeBlock = CreateReactNodeExtension({
  name: "CodeBlock",
  dataType: "code-block",
  defaultAttrs: defaultCodeAttrs,
  component: CodeBlockView,
  group: "block",
  maxSize: codeMaxSize,
  draggable: true,
  toolbarFields: [],
});
