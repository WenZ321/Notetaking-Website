import type { ReactNodeViewProps } from "@tiptap/react";
import type { ComponentType } from "react";
import type {
  BaseAttrs,
  TypedNode,
  PreviewComponentProps,
  EditorComponentProps,
  InPageEditorComponentProps,
} from "./NodeComponentTypes";

// A preview, plus the editor that opens from it
export type PreviewComponents<TAttrs extends BaseAttrs> = {
  ViewComponent: ComponentType<PreviewComponentProps<TAttrs>>;
  EditorComponent: ComponentType<EditorComponentProps<TAttrs>>;
};

// Just an editor that stays on the page
export type NoPreviewComponent<TAttrs extends BaseAttrs> = {
  EditorComponent: ComponentType<InPageEditorComponentProps<TAttrs>>;
};

// What a block shows: a preview that opens an editor, or just an editor
// that stays on the page
export type BlockContent<TAttrs extends BaseAttrs> =
  | ({ hasPreview: true } & PreviewComponents<TAttrs>)
  | ({ hasPreview: false } & NoPreviewComponent<TAttrs>);

// Information common to block and inline node views
type SharedOptions = {
  dataType: string;
};

// Only block nodes ("div") can be resized - inline nodes ("span") flow with
// the surrounding text, so a user-draggable pixel size doesn't apply to them.
// Inline nodes always have a preview
export type CreateReactNodeViewOptions<TAttrs extends BaseAttrs> =
  | (SharedOptions & {
      resizable: boolean;
      wrapperTag: "div";
    } & BlockContent<TAttrs>)
  | (SharedOptions & { wrapperTag: "span" } & PreviewComponents<TAttrs>);

// Props shared by BlockNodeView and InlineNodeView, the two bodies
// CreateReactNodeView dispatches between based on wrapperTag
export type CommonNodeViewProps<TAttrs extends BaseAttrs> = Omit<
  ReactNodeViewProps,
  "node" | "updateAttributes"
> &
  SharedOptions & {
    node: TypedNode<TAttrs>;
    updateAttributes: (attrs: Partial<TAttrs>) => void;
    isEditing: boolean;
    setIsEditing: (value: boolean) => void;
  };
