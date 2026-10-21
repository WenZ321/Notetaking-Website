import type { ReactNodeViewProps } from "@tiptap/react";
import type { RefObject } from "react";

// Default attributes of all custom react extensions will have this structure
export type BaseAttrs = Record<string, unknown>;

export type TypedNode<TAttrs extends BaseAttrs> = ReactNodeViewProps["node"] & {
  attrs: TAttrs;
};

// <!---- Preview Props ----!>

// Preview of a block, drawn at the block's size
export type BlockPreviewComponentProps<TAttrs extends BaseAttrs> = {
  width: number;
  height: number;
  node: TypedNode<TAttrs>;
  openEditor: () => void;
  reportMinWidth: (minWidth: number) => void; // Lets the preview stop the box from shrinking past what its content needs
  reportMinHeight: (minHeight: number) => void; // Lets the preview stop the box from getting shorter than its content
};

// Preview of an inline node, which flows with the text and has no size of its own
export type InlinePreviewComponentProps<TAttrs extends BaseAttrs> = {
  node: TypedNode<TAttrs>;
  openEditor: () => void;
};

// <!---- Editor Props ----!>

// Editor of a block, opened over the page from its preview
export type BlockEditorComponentProps<TAttrs extends BaseAttrs> = {
  node: TypedNode<TAttrs>;
  updateAttributes: (attrs: Partial<TAttrs>) => void;
  closeEditor: () => void;
};

// Editor of an inline node, opened in place of its preview inside the text
export type InlineEditorComponentProps<TAttrs extends BaseAttrs> = {
  node: TypedNode<TAttrs>;
  anchorRef: RefObject<HTMLElement | null>; // the node's own box on the page, for placing things next to it
  updateAttributes: (attrs: Partial<TAttrs>) => void;
  closeEditor: () => void;
};

// Editor of a block with no preview. It always sits on the page,
// so there's nothing to close
export type InPageEditorComponentProps<TAttrs extends BaseAttrs> = {
  width: number;
  height: number;
  node: TypedNode<TAttrs>;
  updateAttributes: (attrs: Partial<TAttrs>) => void;
};
