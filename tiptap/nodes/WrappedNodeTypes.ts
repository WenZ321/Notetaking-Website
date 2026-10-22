import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

// The whole page
export type PageNode = ProseMirrorNode;

// A node right on the page: a line of text, a row, or a custom block that
// isn't in a row yet
export type TopLevelNode = ProseMirrorNode;

// A row of custom blocks, with a newspaper's text beside them
export type WrappedBlockNode = ProseMirrorNode;

// One line of text in a text column, like a paragraph or a heading
export type TextLineNode = ProseMirrorNode;

// One of the app's custom blocks, like a math, chem, diagram or matrix block
export type CustomBlockNode = ProseMirrorNode;

// A text column in a wrapped block, holding lines of text
export type TextColumnNode = ProseMirrorNode;

// A column in a wrapped block: a text column or a column holding one custom block
export type WrappedColumnNode = ProseMirrorNode;
