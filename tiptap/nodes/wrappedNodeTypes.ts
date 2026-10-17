import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

export type WrappedNode = ProseMirrorNode;

// One line of text in a text column, like a paragraph or a heading
export type TextLineNode = ProseMirrorNode;

// One of the app's custom blocks, like a math, chem, diagram or matrix block
export type CustomBlockNode = ProseMirrorNode;
