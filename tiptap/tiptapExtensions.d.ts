import "@tiptap/core";
import type { NotebookTemplate } from "@/types/notebook";
import type {
  InsertBlockOptions,
  InsertNodeOptions,
} from "./nodes/SharedNodeParts/NodeFactory/ReactNodeFactory";

// Declares editor.commands types for our custom tiptap node extensions.
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    diagramBlock: {
      insertDiagramBlock: (options: InsertBlockOptions) => ReturnType;
      deleteDiagramBlock: () => ReturnType;
    };
  }
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathBlock: {
      insertMathBlock: (options: InsertBlockOptions) => ReturnType;
      deleteMathBlock: () => ReturnType;
    };
  }
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathInline: {
      insertMathInline: (
        options?: InsertNodeOptions<"fontSize" | "textColor">,
      ) => ReturnType;
      deleteMathInline: () => ReturnType;
    };
  }
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    MatrixBlock: {
      insertMatrixBlock: (
        rows: number,
        cols: number,
        template: NotebookTemplate,
      ) => ReturnType;
      deleteMatrixBlock: () => ReturnType;
    };
  }
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    chemBlock: {
      insertChemBlock: (options: InsertBlockOptions) => ReturnType;
      deleteChemBlock: () => ReturnType;
    };
  }
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    CodeBlock: {
      insertCodeBlock: (options: InsertBlockOptions) => ReturnType;
      deleteCodeBlock: () => ReturnType;
    };
  }
}
