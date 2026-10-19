import type { CodeBlockAttrs } from "./CodeBlockType";
import type { MaxBlockSize } from "../SharedNodeParts/NodeFactory/ReactNodeFactory";
import { CodeBlockView } from "./CodeBlockView";
import { CreateReactNodeExtension } from "../SharedNodeParts/NodeFactory/ReactNodeFactory";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";

// Starting size/content for a brand-new code block
const defaultCodeAttrs: CodeBlockAttrs = {
  language: "python",
  code: "",
  width: 600,
  height: 300,
};

// Widest and tallest a code block can be
const codeMaxSize: MaxBlockSize = {
  maxWidth: NOTEBOOK_PAGE_WIDTH,
  maxHeight: 600,
};

// Defines the CodeBlock tiptap node: a piece of code in one language,
// edited right on the page
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
