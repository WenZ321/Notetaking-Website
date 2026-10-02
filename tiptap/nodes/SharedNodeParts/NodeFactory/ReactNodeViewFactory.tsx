import type { ReactNodeViewProps } from "@tiptap/react";
import type { ComponentType, RefObject } from "react";
import { useState, useEffect } from "react";
import { BlockNodeView } from "./BlockNodeView";
import { InlineNodeView } from "./InlineNodeView";
import "./ReactNodeViewFactory.css";

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
  // Lets a resizable preview stop the box from shrinking past what its content needs
  reportMinWidth?: (minWidth: number) => void;
};

// Editor component of the node
export type EditorComponentProps<TAttrs extends BaseAttrs> = {
  node: TypedNode<TAttrs>;
  updateAttributes: (attrs: Partial<TAttrs>) => void;
  closeEditor: () => void;
  // Only for inline nodes, the editing component is rendered in place of the preview
  // This is to make editing inline nodes feel more natural
  // Block nodes render the editing component in an overlay
  anchorRef?: RefObject<HTMLElement | null>;
};

// Information common to block and inline node views
type SharedOptions<TAttrs extends BaseAttrs> = {
  dataType: string;
  ViewComponent: ComponentType<PreviewComponentProps<TAttrs>>;
  EditorComponent: ComponentType<EditorComponentProps<TAttrs>>;
};

// Only block nodes ("div") can be resized - inline nodes ("span") flow with
// the surrounding text, so a user-draggable pixel size doesn't apply to them
export type CreateReactNodeViewOptions<TAttrs extends BaseAttrs> =
  | (SharedOptions<TAttrs> & { wrapperTag: "div"; resizable: boolean })
  | (SharedOptions<TAttrs> & { wrapperTag: "span" });

// Props shared by BlockNodeView and InlineNodeView, the two bodies
// CreateReactNodeView dispatches between based on wrapperTag
export type CommonNodeViewProps<TAttrs extends BaseAttrs> = Omit<
  ReactNodeViewProps,
  "node" | "updateAttributes"
> &
  SharedOptions<TAttrs> & {
    node: TypedNode<TAttrs>;
    updateAttributes: (attrs: Partial<TAttrs>) => void;
    isEditing: boolean;
    setIsEditing: (value: boolean) => void;
  };

// Builds the interactive editor wrapper (drag handle, resize, delete, preview/edit toggle)
// shared by every custom react node, given just its preview and editor components.
export function CreateReactNodeView<TAttrs extends BaseAttrs>(
  options: CreateReactNodeViewOptions<TAttrs>,
): ComponentType<ReactNodeViewProps> {
  return function ReactNodeView(props: ReactNodeViewProps) {
    const { editor } = props;
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
      editor.setEditable(!isEditing);

      return () => {
        editor.setEditable(true);
      };
    }, [editor, isEditing]);

    const commonProps: CommonNodeViewProps<TAttrs> = {
      ...props,
      dataType: options.dataType,
      ViewComponent: options.ViewComponent,
      EditorComponent: options.EditorComponent,
      // tiptap's node/updateAttributes types don't know our specific TAttrs, so narrow them here
      node: props.node as TypedNode<TAttrs>,
      updateAttributes: props.updateAttributes as (
        attrs: Partial<TAttrs>,
      ) => void,
      isEditing,
      setIsEditing,
    };

    if (options.wrapperTag === "span") {
      return <InlineNodeView {...commonProps} />;
    } else {
      return <BlockNodeView {...commonProps} resizable={options.resizable} />;
    }
  };
}
