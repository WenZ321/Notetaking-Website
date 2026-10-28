import type {
  CustomBlockNode,
  TextLineNode,
  WrappedBlockNode,
} from "@/tiptap/nodes/WrappedNodeTypes";
import type { Wrap } from "@/tiptap/nodes/WrappedBlock/WrappedBlockType";
import { Node, getSchema } from "@tiptap/core";
import { Paragraph } from "@/tiptap/nodes/Paragraph/Paragraph";
import { WrappedBlock } from "@/tiptap/nodes/WrappedBlock/WrappedBlock";
import { WrappedColumn } from "@/tiptap/nodes/WrappedBlock/WrappedColumn";
import { isTextColumn } from "@/tiptap/extensions/WrappedBlocks/WrappedBlockUtils";

// The page and its text, the least a page needs
const Page = Node.create({ name: "doc", topNode: true, content: "block+" });
const Text = Node.create({ name: "text", group: "inline" });

// A stand-in for the app's custom blocks. It has a width and height and
// joins rows like them, without the editor and preview they draw
const TestBlock = Node.create({
  name: "TestBlock",
  group: "block wrappableBlock",
  atom: true,
  addAttributes() {
    return { width: { default: 200 }, height: { default: 100 } };
  },
});

// The real rows, columns and lines, so tests build what the app builds
export const schema = getSchema([
  Page,
  Text,
  Paragraph,
  WrappedBlock,
  WrappedColumn,
  TestBlock,
]);

export function makeBlock(width: number, height = 100): CustomBlockNode {
  return schema.nodes.TestBlock.create({ width, height });
}

export function makeLine(text: string): TextLineNode {
  return schema.nodes.paragraph.create(null, text ? schema.text(text) : null);
}

// A row wrapped left or right, holding only blocks
export function makeRow(
  wrap: Wrap,
  blocks: CustomBlockNode[],
): WrappedBlockNode {
  const columns = blocks.map((block) =>
    schema.nodes.WrappedColumn.create({ columnType: "block" }, block),
  );
  return schema.nodes.WrappedBlock.create({ wrap }, columns);
}

// A newspaper: its left text, its blocks, then its right text
export function makeNewspaper(
  leftLines: TextLineNode[],
  blocks: CustomBlockNode[],
  rightLines: TextLineNode[],
): WrappedBlockNode {
  const textColumn = (lines: TextLineNode[]) =>
    schema.nodes.WrappedColumn.create(
      { columnType: "text", width: 200 },
      lines,
    );
  const blockColumns = blocks.map((block) =>
    schema.nodes.WrappedColumn.create({ columnType: "block" }, block),
  );
  return schema.nodes.WrappedBlock.create({ wrap: "newspaper" }, [
    textColumn(leftLines),
    ...blockColumns,
    textColumn(rightLines),
  ]);
}

// A row's blocks, left to right
export function getBlocks(row: WrappedBlockNode): CustomBlockNode[] {
  const blocks: CustomBlockNode[] = [];
  row.forEach((column) => {
    if (!isTextColumn(column)) blocks.push(column.firstChild!);
  });
  return blocks;
}

// The widths of a row's blocks, left to right
export function getBlockWidths(row: WrappedBlockNode): number[] {
  return getBlocks(row).map((block) => block.attrs.width);
}

// The heights of a row's blocks, left to right
export function getBlockHeights(row: WrappedBlockNode): number[] {
  return getBlocks(row).map((block) => block.attrs.height);
}

// A newspaper's two text widths, left then right
export function getTextWidths(row: WrappedBlockNode): number[] {
  const widths: number[] = [];
  row.forEach((column) => {
    if (isTextColumn(column)) widths.push(column.attrs.width);
  });
  return widths;
}
