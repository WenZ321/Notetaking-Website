import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import type {
  CustomBlockNode,
  TextColumnNode,
  WrappedBlockNode,
} from "@/tiptap/nodes/WrappedNodeTypes";
import { isTextColumn } from "./WrappedBlockLayout/ArrangeWrappedBlocks";

// How much room these nodes take up in the page, added together
export function sumNodeSizes(nodes: readonly ProseMirrorNode[]): number {
  return nodes.reduce((sum, node) => sum + node.nodeSize, 0);
}

/**
 * Where the block in one of a wrapped block's columns starts. It sits just
 * inside its column, after the columns before it
 * @param wrappedBlockStart Where the wrapped block starts
 * @param columns The wrapped block's columns, left to right
 * @param columnIndex Which column holds the block
 * @returns The block's position
 */
export function getBlockPosInColumn(
  wrappedBlockStart: number,
  columns: readonly ProseMirrorNode[],
  columnIndex: number,
): number {
  const columnsBefore = sumNodeSizes(columns.slice(0, columnIndex));
  return wrappedBlockStart + 1 + columnsBefore + 1;
}

// The smallest size a block's content allows
export type MinBlockSize = {
  width: number;
  height: number;
};

const MIN_SIZE_SELECTOR = "[data-content-min-width]";

/**
 * Reads the smallest size a block's content allows, which the block's view
 * writes on the page. Blocks that don't report one get 0
 * @param view The editor
 * @param pos Where the block starts
 * @returns The smallest width and height
 */
export function readContentMinSize(
  view: EditorView,
  pos: number,
): MinBlockSize {
  const dom = view.nodeDOM(pos);
  const element =
    dom instanceof HTMLElement
      ? dom.matches(MIN_SIZE_SELECTOR)
        ? dom
        : dom.querySelector<HTMLElement>(MIN_SIZE_SELECTOR)
      : null;

  return {
    width: Number(element?.dataset.contentMinWidth ?? 0),
    height: Number(element?.dataset.contentMinHeight ?? 0),
  };
}

// A wrapped block's blocks, and the text on the far left and far right of them
export type WrappedBlockParts = {
  existingBlocks: CustomBlockNode[]; // left to right
  textBefore: TextColumnNode | null; // the text column left of every block
  textAfter: TextColumnNode | null; // the text column right of every block
};

// Reads the blocks and the outer text columns out of a wrapped block
export function readWrappedBlockParts(
  wrappedBlock: WrappedBlockNode,
): WrappedBlockParts {
  const columns = wrappedBlock.content.content;
  const blockColumns = columns.filter((column) => !isTextColumn(column));
  const firstBlockIndex = columns.indexOf(blockColumns[0]);
  const lastBlockIndex = columns.lastIndexOf(blockColumns.at(-1)!);

  return {
    existingBlocks: blockColumns.map((column) => column.firstChild!),
    textBefore: columns.slice(0, firstBlockIndex).find(isTextColumn) ?? null,
    textAfter: columns.slice(lastBlockIndex + 1).find(isTextColumn) ?? null,
  };
}

// A column that's just one empty line has no text to move out
function getTextLines(column: TextColumnNode | null): ProseMirrorNode[] {
  const isOneEmptyLine =
    column?.childCount === 1 && column.firstChild!.content.size === 0;
  return column && !isOneEmptyLine ? [...column.content.content] : [];
}

/**
 * The text that leaves a newspaper when it wraps to a side, since a row
 * wrapped left or right holds only blocks. Its left text goes above the
 * row and its right text below it
 * @param textBefore The newspaper's left text column
 * @param textAfter The newspaper's right text column
 * @returns The lines that go above and below the row
 */
export function getTextMovedOut(
  textBefore: TextColumnNode | null,
  textAfter: TextColumnNode | null,
): { above: ProseMirrorNode[]; below: ProseMirrorNode[] } {
  return { above: getTextLines(textBefore), below: getTextLines(textAfter) };
}
