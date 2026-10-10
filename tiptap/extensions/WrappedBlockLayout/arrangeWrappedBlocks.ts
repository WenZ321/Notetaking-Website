import type {
  Node as ProseMirrorNode,
  NodeType,
  Schema,
} from "@tiptap/pm/model";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/notebookPageConstants";

// Every custom block node is part of this group
const WRAPPABLE_GROUP = "wrappableBlock";

// Most columns a row can have
export const MAX_COLUMNS = 3;

// The node types a row is built from
export type RowTypes = {
  rowNodeType: NodeType;
  columnNodeType: NodeType;
  paragraphNodeType: NodeType;
};

// Looks up the node types a row is built from in the editor's schema
export function getRowTypes(schema: Schema): RowTypes {
  return {
    rowNodeType: schema.nodes.WrappedBlock,
    columnNodeType: schema.nodes.WrappedColumn,
    paragraphNodeType: schema.nodes.paragraph,
  };
}

// What goes in one column: a single custom block, or a stretch of text
type Piece =
  | { columnType: "block"; node: ProseMirrorNode }
  | { columnType: "text"; nodes: ProseMirrorNode[]; width: number | null };

function isWrappable(node: ProseMirrorNode): boolean {
  return (node.type.spec.group ?? "").split(" ").includes(WRAPPABLE_GROUP);
}

// True when the block takes up the whole page width
function isFullWidth(node: ProseMirrorNode): boolean {
  return node.attrs.width >= NOTEBOOK_PAGE_WIDTH;
}

// Splits content into pieces: each custom block gets its own piece, and text
// next to other text is joined into one piece, left side first. A text
// piece keeps the saved width of the column it came from
function addPieces(
  pieces: Piece[],
  nodes: readonly ProseMirrorNode[],
  rowTypes: RowTypes,
  columnWidth: number | null = null,
) {
  nodes.forEach((node) => {
    // rows and columns are taken apart, e.g. a row dropped into a column
    const { rowNodeType, columnNodeType } = rowTypes;
    if (node.type === rowNodeType || node.type === columnNodeType) {
      const width = node.type === columnNodeType ? node.attrs.width : null;
      addPieces(pieces, node.content.content, rowTypes, width);
      return;
    }

    if (isWrappable(node)) {
      pieces.push({ columnType: "block", node });
      return;
    }

    const last = pieces[pieces.length - 1];
    if (last?.columnType === "text") {
      last.nodes.push(node);
    } else {
      pieces.push({ columnType: "text", nodes: [node], width: columnWidth });
    }
  });
}

// Picks which pieces stay in the row, left to right. The rest moves below
// the row: anything past 3 columns, or blocks that don't fit side by side
function splitRow(pieces: Piece[]): { kept: Piece[]; movedOut: Piece[] } {
  // a full-width block leaves no room, so everything else moves out
  const fullWidthBlock = pieces.find(
    (piece) => piece.columnType === "block" && isFullWidth(piece.node),
  );
  if (fullWidthBlock) {
    return {
      kept: [fullWidthBlock],
      movedOut: pieces.filter((piece) => piece !== fullWidthBlock),
    };
  }

  let usedWidth = 0;
  const firstMovedOut = pieces.findIndex((piece, index) => {
    if (index >= MAX_COLUMNS) return true;
    if (piece.columnType === "text") return false;

    usedWidth += piece.node.attrs.width;
    return usedWidth > NOTEBOOK_PAGE_WIDTH;
  });

  if (firstMovedOut === -1) return { kept: pieces, movedOut: [] };

  return {
    kept: pieces.slice(0, firstMovedOut),
    movedOut: pieces.slice(firstMovedOut),
  };
}

export function isTextColumn(column: ProseMirrorNode): boolean {
  return column.attrs.columnType === "text";
}

// A column's width: text saves its own, a block column's is its block's
export function getColumnWidth(column: ProseMirrorNode): number {
  return isTextColumn(column)
    ? column.attrs.width
    : column.firstChild!.attrs.width;
}

// The width each text column saves, so the row fills the page. The last text
// column is the filler and gets whatever is left, so the row never goes past
// the page. Other text keeps its saved width, or splits evenly if new
function getTextWidths(kept: Piece[]): (number | null)[] {
  const blocksWidth = kept.reduce(
    (sum, piece) =>
      piece.columnType === "block" ? sum + piece.node.attrs.width : sum,
    0,
  );
  const textSpace = Math.max(0, NOTEBOOK_PAGE_WIDTH - blocksWidth);
  const textCount = kept.filter((piece) => piece.columnType === "text").length;
  const fillerIndex = kept.findLastIndex(
    (piece) => piece.columnType === "text",
  );

  let usedTextWidth = 0;
  return kept.map((piece, index) => {
    if (piece.columnType === "block") return null;
    if (index === fillerIndex) return textSpace - usedTextWidth;

    const width = Math.min(
      piece.width ?? Math.round(textSpace / textCount),
      textSpace - usedTextWidth,
    );
    usedTextWidth += width;
    return width;
  });
}

// Builds a row from pieces, plus whatever has to go below it
function buildRow(pieces: Piece[], rowTypes: RowTypes): ProseMirrorNode[] {
  const { rowNodeType, columnNodeType, paragraphNodeType } = rowTypes;

  // a row with no custom block left is just text on the page
  if (!pieces.some((piece) => piece.columnType === "block")) {
    return pieces.flatMap((piece) =>
      piece.columnType === "text" ? piece.nodes : [],
    );
  }

  const { kept, movedOut } = splitRow(pieces);

  // a lone narrow block gets an empty paragraph on its right to type in
  const onlyPiece = kept.length === 1 ? kept[0] : null;
  if (onlyPiece?.columnType === "block" && !isFullWidth(onlyPiece.node)) {
    kept.push({
      columnType: "text",
      nodes: [paragraphNodeType.create()],
      width: null,
    });
  }

  const textWidths = getTextWidths(kept);
  const columns = kept.map((piece, index) =>
    piece.columnType === "block"
      ? columnNodeType.create({ columnType: "block" }, piece.node)
      : columnNodeType.create(
          { columnType: "text", width: textWidths[index] },
          piece.nodes,
        ),
  );

  // text that moved out goes on the page, a block that moved out gets its own row
  const below = movedOut.flatMap((piece) =>
    piece.columnType === "text" ? piece.nodes : buildRow([piece], rowTypes),
  );

  return [rowNodeType.create(null, columns), ...below];
}

// What one top-level node should turn into. A row is rebuilt so it follows
// the column rules, a custom block on its own becomes a row
export function arrangeTopLevelNode(
  node: ProseMirrorNode,
  rowTypes: RowTypes,
): ProseMirrorNode[] {
  // paragraphs, headings and the rest stay as they are
  if (node.type !== rowTypes.rowNodeType && !isWrappable(node)) {
    return [node];
  }

  const pieces: Piece[] = [];
  addPieces(pieces, [node], rowTypes);
  return buildRow(pieces, rowTypes);
}

// True when nothing changed, so the node can be left alone
export function isUnchanged(
  node: ProseMirrorNode,
  arranged: ProseMirrorNode[],
) {
  return arranged.length === 1 && arranged[0].eq(node);
}
