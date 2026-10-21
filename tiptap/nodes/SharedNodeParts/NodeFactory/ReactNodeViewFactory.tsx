import type { ReactNodeViewProps } from "@tiptap/react";
import type { ComponentType } from "react";
import type { BaseAttrs, TypedNode } from "./NodeComponentTypes";
import type {
  CreateReactNodeViewOptions,
  CommonNodeViewProps,
} from "./NodeViewTypes";
import { useState, useEffect } from "react";
import { BlockNodeView } from "./BlockNodeView";
import { InlineNodeView } from "./InlineNodeView";
import "./ReactNodeViewFactory.css";

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
      node: props.node as TypedNode<TAttrs>,
      updateAttributes: props.updateAttributes as (
        attrs: Partial<TAttrs>,
      ) => void,
      isEditing,
      setIsEditing,
    };

    if (options.wrapperTag === "span") {
      return (
        <InlineNodeView
          {...commonProps}
          ViewComponent={options.ViewComponent}
          EditorComponent={options.EditorComponent}
        />
      );
    } else {
      return (
        <BlockNodeView
          {...commonProps}
          resizable={options.resizable}
          content={options}
        />
      );
    }
  };
}
