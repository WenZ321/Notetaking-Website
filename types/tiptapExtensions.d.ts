import "@tiptap/core";

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
      insertMathInline: () => ReturnType;
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
