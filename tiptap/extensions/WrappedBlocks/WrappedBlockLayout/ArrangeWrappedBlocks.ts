import type {
  Node as ProseMirrorNode,
  NodeType,
  Schema,
} from "@tiptap/pm/model";
import { Fragment } from "@tiptap/pm/model";
import {
  NOTEBOOK_PAGE_WIDTH,
  WRAP_GAP,
} from "@/constants/NotebookPageConstants";

// Every custom block node is part of this group
const WRAPPABLE_GROUP = "wrappableBlock";

// How a wrapped block sits with the text around it:
// left and right float the blocks to that side, and the page text after
// them wraps beside them and continues under them.
// newspaper keeps text on both sides of the blocks, which flows down the
// left side, then down the right side, then under the blocks
export type Wrap = "left" | "right" | "newspaper";

// What a new wrapped block starts as
export const DEFAULT_WRAP: Wrap = "left";

// Most blocks side by side in one wrapped block
export const MAX_BLOCKS = 3;

// Most columns a wrapped block can have: its blocks, plus a newspaper's two
// text columns
export const MAX_COLUMNS = MAX_BLOCKS + 2;

// Narrowest text beside blocks can be, so it stays readable
export const MIN_TEXT_WIDTH = Math.round(NOTEBOOK_PAGE_WIDTH * 0.2);

/**
 * How wide a wrapped block's blocks can be in total, leaving the text
 * beside them at least the smallest text width
 * @param wrap How the wrapped block sits with its text
 * @returns The widest the blocks can be together
 */
export function getBlocksRoom(wrap: Wrap): number {
  return wrap === "newspaper"
    ? NOTEBOOK_PAGE_WIDTH - 2 * MIN_TEXT_WIDTH
    : NOTEBOOK_PAGE_WIDTH - MIN_TEXT_WIDTH - WRAP_GAP;
}

// The node types a wrapped block is built from
export type WrappedBlockTypes = {
  wrappedBlockNodeType: NodeType;
  columnNodeType: NodeType;
  paragraphNodeType: NodeType;
};

// Looks up the node types a wrapped block is built from in the editor's schema
export function getWrappedBlockTypes(schema: Schema): WrappedBlockTypes {
  return {
    wrappedBlockNodeType: schema.nodes.WrappedBlock,
    columnNodeType: schema.nodes.WrappedColumn,
    paragraphNodeType: schema.nodes.paragraph,
  };
}

// What goes in one column: a single custom block, or a stretch of text
type Piece =
  | { columnType: "block"; node: ProseMirrorNode }
  | { columnType: "text"; nodes: ProseMirrorNode[]; width: number | null };

type BlockPiece = Extract<Piece, { columnType: "block" }>;

function isWrappable(node: ProseMirrorNode): boolean {
  return (node.type.spec.group ?? "").split(" ").includes(WRAPPABLE_GROUP);
}

// Splits content into pieces: each custom block gets its own piece, and text
// next to other text is joined into one piece, left side first. A text
// piece keeps the saved width of the column it came from
function addPieces(
  pieces: Piece[],
  nodes: readonly ProseMirrorNode[],
  wrappedBlockTypes: WrappedBlockTypes,
  columnWidth: number | null = null,
) {
  nodes.forEach((node) => {
    // wrapped blocks and columns are taken apart, e.g. a wrapped block dropped into a column
    const { wrappedBlockNodeType, columnNodeType } = wrappedBlockTypes;
    if (node.type === wrappedBlockNodeType || node.type === columnNodeType) {
      const width = node.type === columnNodeType ? node.attrs.width : null;
      addPieces(pieces, node.content.content, wrappedBlockTypes, width);
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

// Picks which blocks stay side by side, left to right. A block that would
// go past the blocks' room, or past the most blocks, moves out. The first
// block always stays, even when it's too wide on its own
function splitBlocks(
  blocks: BlockPiece[],
  wrap: Wrap,
): { kept: BlockPiece[]; movedOut: BlockPiece[] } {
  const room = getBlocksRoom(wrap);
  let usedWidth = 0;
  const firstMovedOut = blocks.findIndex((block, index) => {
    usedWidth += block.node.attrs.width;
    return index > 0 && (index >= MAX_BLOCKS || usedWidth > room);
  });

  if (firstMovedOut === -1) return { kept: blocks, movedOut: [] };
  return {
    kept: blocks.slice(0, firstMovedOut),
    movedOut: blocks.slice(firstMovedOut),
  };
}

// Two lines that meet when text is combined become one when both are lines
// of text that fit together
export function canJoinLines(
  first: ProseMirrorNode | null,
  second: ProseMirrorNode | null,
): boolean {
  return (
    !!first &&
    !!second &&
    first.isTextblock &&
    second.isTextblock &&
    first.canAppend(second)
  );
}

// Puts two stretches of text one after the other, joining the lines where
// they meet into one line when they can be
export function joinText(first: Fragment, second: Fragment): Fragment {
  const last = first.lastChild;
  const next = second.firstChild;
  if (!last || !next || !canJoinLines(last, next)) return first.append(second);

  const lines: ProseMirrorNode[] = [];
  first.forEach((line) => lines.push(line));
  lines[lines.length - 1] = last.copy(last.content.append(next.content));
  second.forEach((line, _, index) => {
    if (index > 0) lines.push(line);
  });
  return Fragment.fromArray(lines);
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

// A newspaper's two text widths. The left keeps its saved width, or half the
// space when it's new, and the right fills the rest. Both stay at least the
// smallest text width
export function getNewspaperTextWidths(
  blocksWidth: number,
  savedLeftWidth: number | null,
): [number, number] {
  const textSpace = NOTEBOOK_PAGE_WIDTH - blocksWidth;
  const wantedLeftWidth = savedLeftWidth ?? Math.round(textSpace / 2);
  const leftWidth = Math.min(
    Math.max(wantedLeftWidth, MIN_TEXT_WIDTH),
    textSpace - MIN_TEXT_WIDTH,
  );
  return [leftWidth, textSpace - leftWidth];
}

// Builds a wrapped block from pieces, plus the text and blocks that go
// around it. Left and right wrapped blocks hold only blocks, so their text
// goes on the page: text before the blocks above, text after them below.
// A newspaper keeps text before the blocks on its left and the rest on its right
function buildWrappedBlock(
  pieces: Piece[],
  wantedWrap: Wrap,
  wrappedBlockTypes: WrappedBlockTypes,
): ProseMirrorNode[] {
  const { wrappedBlockNodeType, columnNodeType, paragraphNodeType } =
    wrappedBlockTypes;

  const blocks = pieces.filter(
    (piece): piece is BlockPiece => piece.columnType === "block",
  );
  const textNodesOf = (part: Piece[]) =>
    part.flatMap((piece) => (piece.columnType === "text" ? piece.nodes : []));

  // a wrapped block with no custom block left is just text on the page
  if (blocks.length === 0) return textNodesOf(pieces);

  const firstBlockIndex = pieces.indexOf(blocks[0]);
  const textBefore = textNodesOf(pieces.slice(0, firstBlockIndex));
  const textAfter = textNodesOf(pieces.slice(firstBlockIndex + 1));
  const firstPiece = pieces[0];
  const savedLeftWidth =
    firstPiece.columnType === "text" ? firstPiece.width : null;

  // a newspaper too wide to leave text on both sides wraps left instead
  const firstBlockWidth = blocks[0].node.attrs.width as number;
  const wrap =
    wantedWrap === "newspaper" && firstBlockWidth > getBlocksRoom("newspaper")
      ? DEFAULT_WRAP
      : wantedWrap;

  const { kept, movedOut } = splitBlocks(blocks, wrap);

  // every block in a wrapped block shares the tallest one's height
  const sharedHeight = Math.max(
    ...kept.map((piece) => piece.node.attrs.height as number),
  );
  const blockColumns = kept.map(({ node }) =>
    columnNodeType.create(
      { columnType: "block" },
      node.attrs.height === sharedHeight
        ? node
        : node.type.create(
            { ...node.attrs, height: sharedHeight },
            node.content,
            node.marks,
          ),
    ),
  );

  // blocks that didn't fit each get their own wrapped block, right after
  const movedOutWrappedBlocks = movedOut.flatMap((piece) =>
    buildWrappedBlock([piece], DEFAULT_WRAP, wrappedBlockTypes),
  );

  if (wrap !== "newspaper") {
    const wrappedBlock = wrappedBlockNodeType.create({ wrap }, blockColumns);
    return [
      ...textBefore,
      wrappedBlock,
      ...movedOutWrappedBlocks,
      ...textAfter,
    ];
  }

  // a newspaper always has text on both sides, even if it's an empty line
  const blocksWidth = kept.reduce(
    (sum, piece) => sum + (piece.node.attrs.width as number),
    0,
  );
  const [leftWidth, rightWidth] = getNewspaperTextWidths(
    blocksWidth,
    savedLeftWidth,
  );
  const textColumn = (lines: ProseMirrorNode[], width: number) =>
    columnNodeType.create(
      { columnType: "text", width },
      lines.length > 0 ? lines : paragraphNodeType.create(),
    );
  const wrappedBlock = wrappedBlockNodeType.create({ wrap }, [
    textColumn(textBefore, leftWidth),
    ...blockColumns,
    textColumn(textAfter, rightWidth),
  ]);
  return [wrappedBlock, ...movedOutWrappedBlocks];
}

// What one top-level node should turn into. A wrapped block is rebuilt so it follows
// the column rules for its wrap, a custom block on its own becomes a wrapped block
export function arrangeTopLevelNode(
  node: ProseMirrorNode,
  wrappedBlockTypes: WrappedBlockTypes,
): ProseMirrorNode[] {
  const isWrappedBlock = node.type === wrappedBlockTypes.wrappedBlockNodeType;

  // paragraphs, headings and the rest stay as they are
  if (!isWrappedBlock && !isWrappable(node)) return [node];

  const pieces: Piece[] = [];
  addPieces(pieces, [node], wrappedBlockTypes);
  const wrap: Wrap = isWrappedBlock ? node.attrs.wrap : DEFAULT_WRAP;
  return buildWrappedBlock(pieces, wrap, wrappedBlockTypes);
}

// True when nothing changed, so the node can be left alone
export function isAlreadyArranged(
  node: ProseMirrorNode,
  arranged: ProseMirrorNode[],
) {
  return arranged.length === 1 && arranged[0].eq(node);
}
