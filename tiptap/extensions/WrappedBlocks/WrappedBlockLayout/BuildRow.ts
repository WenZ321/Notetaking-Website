import type { Schema } from "@tiptap/pm/model";
import type { Wrap } from "@/tiptap/nodes/WrappedBlock/WrappedBlockType";
import type {
  CustomBlockNode,
  TextLineNode,
  TopLevelNode,
  WrappedBlockNode,
} from "@/tiptap/nodes/WrappedNodeTypes";
import { NOTEBOOK_PAGE_WIDTH } from "@/constants/NotebookPageConstants";
import { DEFAULT_WRAP } from "@/tiptap/nodes/WrappedBlock/WrappedBlockType";
import {
  MAX_BLOCKS,
  getBlocksRoom,
  getNewspaperTextWidths,
  isCustomBlock,
  isTextColumn,
} from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";

// What a row is made of, however it ended up arranged
type RowParts = {
  blocks: CustomBlockNode[]; // left to right
  textBefore: TextLineNode[]; // lines before the first block
  textAfter: TextLineNode[]; // lines after the first block
  leftTextWidth: number | null; // the saved width of a text column on the far left
};

/**
 * Reads a row's blocks and lines in order, looking inside any column or row
 * that ended up in it, like a row pasted into a text column
 * @param row The row
 * @returns Its parts
 */
function readRowParts(row: WrappedBlockNode): RowParts {
  const firstColumn = row.firstChild;
  const parts: RowParts = {
    blocks: [],
    textBefore: [],
    textAfter: [],
    leftTextWidth:
      firstColumn && isTextColumn(firstColumn) ? firstColumn.attrs.width : null,
  };

  row.descendants((node) => {
    const isContainer =
      node.type.name === "WrappedBlock" || node.type.name === "WrappedColumn";
    if (isContainer) return true;

    if (isCustomBlock(node)) parts.blocks.push(node);
    else if (parts.blocks.length === 0) parts.textBefore.push(node);
    else parts.textAfter.push(node);
    return false;
  });
  return parts;
}

/**
 * Builds a row the way the rules say, plus anything that goes around it.
 * Every rule is a step below
 * @param parts The row's blocks and lines
 * @param wantedWrap The wrap the row asks for
 * @param schema The editor's node types
 * @returns The nodes that take the row's place
 */
function buildRow(
  { blocks, textBefore, textAfter, leftTextWidth }: RowParts,
  wantedWrap: Wrap,
  schema: Schema,
): TopLevelNode[] {
  // a row with no blocks left is just its text
  if (blocks.length === 0) return [...textBefore, ...textAfter];

  // a newspaper whose block can't leave text on both sides wraps left
  const firstBlockWidth = blocks[0].attrs.width as number;
  const isTooWideForNewspaper =
    wantedWrap === "newspaper" && firstBlockWidth > getBlocksRoom("newspaper");
  const wrap = isTooWideForNewspaper ? DEFAULT_WRAP : wantedWrap;

  // blocks past the most a row holds, or past the page, move to rows of
  // their own below. The first block always stays. A row wrapped left or
  // right can fill the page, a newspaper keeps room for its text
  const room = wrap === "newspaper" ? getBlocksRoom(wrap) : NOTEBOOK_PAGE_WIDTH;
  let usedWidth = 0;
  const firstMovedOut = blocks.findIndex((block, index) => {
    usedWidth += block.attrs.width;
    return index > 0 && (index >= MAX_BLOCKS || usedWidth > room);
  });
  const keptBlocks =
    firstMovedOut === -1 ? blocks : blocks.slice(0, firstMovedOut);
  const movedOutRows =
    firstMovedOut === -1
      ? []
      : blocks
          .slice(firstMovedOut)
          .flatMap((block) => buildBareBlock(block, schema));

  // every block in a row takes the tallest one's height
  const height = Math.max(
    ...keptBlocks.map((block) => block.attrs.height as number),
  );
  const blockColumns = keptBlocks.map((block) =>
    schema.nodes.WrappedColumn.create(
      { columnType: "block" },
      block.attrs.height === height
        ? block
        : block.type.create(
            { ...block.attrs, height },
            block.content,
            block.marks,
          ),
    ),
  );

  // a row wrapped left or right holds only blocks, so its text goes on the
  // page: the text before its blocks above it, the rest below
  if (wrap !== "newspaper") {
    const row = schema.nodes.WrappedBlock.create({ wrap }, blockColumns);
    return [...textBefore, row, ...movedOutRows, ...textAfter];
  }

  // a newspaper always has text on both sides, even just an empty line,
  // and its text widths fill the rest of the page
  const blocksWidth = keptBlocks.reduce(
    (sum, block) => sum + (block.attrs.width as number),
    0,
  );
  const [leftWidth, rightWidth] = getNewspaperTextWidths(
    blocksWidth,
    leftTextWidth,
  );
  const textColumn = (lines: TextLineNode[], width: number) =>
    schema.nodes.WrappedColumn.create(
      { columnType: "text", width },
      lines.length > 0 ? lines : schema.nodes.paragraph.create(),
    );
  const row = schema.nodes.WrappedBlock.create({ wrap }, [
    textColumn(textBefore, leftWidth),
    ...blockColumns,
    textColumn(textAfter, rightWidth),
  ]);
  return [row, ...movedOutRows];
}

// A custom block on its own gets a row of its own
function buildBareBlock(
  block: CustomBlockNode,
  schema: Schema,
): TopLevelNode[] {
  const parts = { blocks: [block], textBefore: [], textAfter: [] };
  return buildRow({ ...parts, leftTextWidth: null }, DEFAULT_WRAP, schema);
}

/**
 * What a node on the page should be under the row rules. Lines of text stay
 * as they are, a custom block on its own gets a row, and a row is rebuilt
 * @param node A node on the page
 * @param schema The editor's node types
 * @returns The nodes that should take its place
 */
export function arrangeTopLevelNode(
  node: TopLevelNode,
  schema: Schema,
): TopLevelNode[] {
  if (isCustomBlock(node)) return buildBareBlock(node, schema);
  if (node.type.name !== "WrappedBlock") return [node];
  return buildRow(readRowParts(node), node.attrs.wrap, schema);
}
