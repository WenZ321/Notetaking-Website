import { Fragment } from "@tiptap/pm/model";

/**
 * Splits a text column's lines in two at a spot. A spot inside a paragraph
 * cuts that paragraph into two, each keeping its formatting
 * @param content The column's lines
 * @param offset The spot, counted from the start of the column's lines
 * @returns The lines before the spot and the lines after it
 */
export function splitColumnText(
  content: Fragment,
  offset: number,
): [Fragment, Fragment] {
  // the line the spot falls in, and where that line starts
  const lines = content.content;
  let index = 0;
  let lineStart = 0;
  while (index < lines.length && lineStart + lines[index].nodeSize <= offset) {
    lineStart += lines[index].nodeSize;
    index++;
  }

  // the spot is between two lines, so no line is cut
  if (offset === lineStart) {
    return [
      Fragment.fromArray(lines.slice(0, index)),
      Fragment.fromArray(lines.slice(index)),
    ];
  }

  const line = lines[index];
  const cutAt = offset - lineStart - 1;
  return [
    Fragment.fromArray([...lines.slice(0, index), line.cut(0, cutAt)]),
    Fragment.fromArray([line.cut(cutAt), ...lines.slice(index + 1)]),
  ];
}
