import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import type {
  CustomBlockNode,
  TextColumnNode,
  TextLineNode,
  WrappedBlockNode,
  WrappedColumnNode,
} from "@/tiptap/nodes/WrappedNodeTypes";
import type { Wrap } from "@/tiptap/nodes/WrappedBlock/WrappedBlockType";
import {
  NOTEBOOK_PAGE_WIDTH,
  WRAP_GAP,
} from "@/constants/NotebookPageConstants";

// Most blocks side by side in one row
export const MAX_BLOCKS = 3;

// Most columns a row can have: its blocks, plus a newspaper's two text columns
export const MAX_COLUMNS = MAX_BLOCKS + 2;

// Narrowest text beside blocks can be, so it stays readable
export const MIN_TEXT_WIDTH = Math.round(NOTEBOOK_PAGE_WIDTH * 0.2);

/**
 * How wide a row's blocks can be in total, leaving the text beside them at
 * least the smallest text width
 * @param wrap How the row sits with its text
 * @returns The widest the blocks can be together
 */
export function getBlocksRoom(wrap: Wrap): number {
  return wrap === "newspaper"
    ? NOTEBOOK_PAGE_WIDTH - 2 * MIN_TEXT_WIDTH
    : NOTEBOOK_PAGE_WIDTH - MIN_TEXT_WIDTH - WRAP_GAP;
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

// Every custom block node is part of this group
const CUSTOM_BLOCK_GROUP = "wrappableBlock";

export function isCustomBlock(node: ProseMirrorNode): boolean {
  return (node.type.spec.group ?? "").split(" ").includes(CUSTOM_BLOCK_GROUP);
}

export function isTextColumn(column: WrappedColumnNode): boolean {
  return column.attrs.columnType === "text";
}

// A column's width: text saves its own, a block column's is its block's
export function getColumnWidth(column: WrappedColumnNode): number {
  return isTextColumn(column)
    ? column.attrs.width
    : column.firstChild!.attrs.width;
}

// A row as drawn on the page. The editor's node is the box around it,
// which has no height when the row floats, so this reads the row inside
export function getRowDom(view: EditorView, pos: number): HTMLElement | null {
  const box = view.nodeDOM(pos);
  const row = box instanceof HTMLElement ? box.firstElementChild : null;
  return row instanceof HTMLElement ? row : null;
}

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
  columns: readonly WrappedColumnNode[],
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
function getTextLines(column: TextColumnNode | null): TextLineNode[] {
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
): { above: TextLineNode[]; below: TextLineNode[] } {
  return { above: getTextLines(textBefore), below: getTextLines(textAfter) };
}
