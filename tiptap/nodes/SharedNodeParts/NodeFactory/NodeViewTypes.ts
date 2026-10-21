import type { ReactNodeViewProps } from "@tiptap/react";
import type { ComponentType } from "react";
import type {
  BaseAttrs,
  TypedNode,
  BlockPreviewComponentProps,
  InlinePreviewComponentProps,
  EditorComponentProps,
  InPageEditorComponentProps,
} from "./NodeComponentTypes";

// A block's preview, plus the editor that opens from it
export type BlockPreviewComponents<TAttrs extends BaseAttrs> = {
  ViewComponent: ComponentType<BlockPreviewComponentProps<TAttrs>>;
  EditorComponent: ComponentType<EditorComponentProps<TAttrs>>;
};

// An inline node's preview, plus the editor that opens in its place
export type InlinePreviewComponents<TAttrs extends BaseAttrs> = {
  ViewComponent: ComponentType<InlinePreviewComponentProps<TAttrs>>;
  EditorComponent: ComponentType<EditorComponentProps<TAttrs>>;
};

// Just an editor that stays on the page
export type NoPreviewComponent<TAttrs extends BaseAttrs> = {
  EditorComponent: ComponentType<InPageEditorComponentProps<TAttrs>>;
};

// What a block shows: a preview that opens an editor, or just an editor
// that stays on the page
export type BlockContent<TAttrs extends BaseAttrs> =
  | ({ hasPreview: true } & BlockPreviewComponents<TAttrs>)
  | ({ hasPreview: false } & NoPreviewComponent<TAttrs>);

// Information common to block and inline node views
type SharedOptions = {
  dataType: string;
};

// Every block node ("div") can be resized. Inline nodes ("span") flow with
// the surrounding text, so they have no size and always have a preview
export type CreateReactNodeViewOptions<TAttrs extends BaseAttrs> =
  | (SharedOptions & { wrapperTag: "div" } & BlockContent<TAttrs>)
  | (SharedOptions & { wrapperTag: "span" } & InlinePreviewComponents<TAttrs>);

// Props shared by BlockNodeView and InlineNodeView, the two bodies
// CreateReactNodeView dispatches between based on wrapperTag
export type CommonNodeViewProps<TAttrs extends BaseAttrs> = Omit<
  ReactNodeViewProps,
  "node" | "updateAttributes" // Removes these two from ReactNodeViewProps
> &
  SharedOptions & {
    // Add our own node and updateAttributes types which are a more specific type
    node: TypedNode<TAttrs>;
    updateAttributes: (attrs: Partial<TAttrs>) => void;
    isEditing: boolean;
    setIsEditing: (value: boolean) => void;
  };
