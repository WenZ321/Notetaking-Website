import type { ReactNodeViewProps } from "@tiptap/react";
import type { RefObject } from "react";

// Default attributes of all custom react extensions will have this structure
export type BaseAttrs = Record<string, unknown>;

export type TypedNode<TAttrs extends BaseAttrs> = ReactNodeViewProps["node"] & {
  attrs: TAttrs;
};

// Preview component of the node
export type PreviewComponentProps<TAttrs extends BaseAttrs> = {
  width?: number;
  height?: number;
  node: TypedNode<TAttrs>;
  openEditor: () => void;
  reportMinWidth?: (minWidth: number) => void; // Lets a resizable preview stop the box from shrinking past what its content needs
  reportMinHeight?: (minHeight: number) => void; // Lets a resizable preview stop the box from getting shorter than its content
};

// Editor component of the node
export type EditorComponentProps<TAttrs extends BaseAttrs> = {
  node: TypedNode<TAttrs>;
  updateAttributes: (attrs: Partial<TAttrs>) => void;
  closeEditor: () => void;
  anchorRef?: RefObject<HTMLElement | null>; // only for inline nodes, whose editor shows in place of the preview so editing feels natural
};

// Editor of a block with no preview. It always sits on the page,
// so there's nothing to close
export type InPageEditorComponentProps<TAttrs extends BaseAttrs> = {
  node: TypedNode<TAttrs>;
  updateAttributes: (attrs: Partial<TAttrs>) => void;
};
