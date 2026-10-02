import type { Node as ProseMirrorNode, NodeType } from "@tiptap/pm/model";
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

// What goes in one column: a single custom block, or a stretch of text
type Piece =
  | { columnType: "block"; node: ProseMirrorNode }
  | { columnType: "text"; nodes: ProseMirrorNode[] };

function isWrappable(node: ProseMirrorNode): boolean {
  return (node.type.spec.group ?? "").split(" ").includes(WRAPPABLE_GROUP);
}

// True when the block takes up the whole page width
function isFullWidth(node: ProseMirrorNode): boolean {
  return node.attrs.width >= NOTEBOOK_PAGE_WIDTH;
}

// Splits content into pieces: each custom block gets its own piece, and text
// next to other text is joined into one piece, left side first
function addPieces(
  pieces: Piece[],
  nodes: readonly ProseMirrorNode[],
  rowTypes: RowTypes,
) {
  nodes.forEach((node) => {
    // rows and columns are taken apart, e.g. a row dropped into a column
    const { rowNodeType, columnNodeType } = rowTypes;
    if (node.type === rowNodeType || node.type === columnNodeType) {
      addPieces(pieces, node.content.content, rowTypes);
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
      pieces.push({ columnType: "text", nodes: [node] });
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
    kept.push({ columnType: "text", nodes: [paragraphNodeType.create()] });
  }

  const columns = kept.map((piece) =>
    piece.columnType === "block"
      ? columnNodeType.create({ columnType: "block" }, piece.node)
      : columnNodeType.create({ columnType: "text" }, piece.nodes),
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
