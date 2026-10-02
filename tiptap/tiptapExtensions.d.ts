import "@tiptap/core";
import type { TextFormatState } from "@/types/textFormatting";

// Declares editor.commands types for our custom tiptap node extensions.
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    diagramBlock: {
      insertDiagramBlock: () => ReturnType;
      deleteDiagramBlock: () => ReturnType;
    };
  }
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathBlock: {
      insertMathBlock: () => ReturnType;
      deleteMathBlock: () => ReturnType;
    };
  }
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathInline: {
      insertMathInline: (
        toolbarValues?: Partial<
          Pick<TextFormatState, "fontSize" | "textColor">
        >,
      ) => ReturnType;
      deleteMathInline: () => ReturnType;
    };
  }
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    MatrixBlock: {
      insertMatrixBlock: (rows: number, cols: number) => ReturnType;
      deleteMatrixBlock: () => ReturnType;
    };
  }
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    chemBlock: {
      insertChemBlock: () => ReturnType;
      deleteChemBlock: () => ReturnType;
    };
  }
}
