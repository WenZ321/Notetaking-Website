import { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { BaseAttrs } from "./NodeComponentTypes";
import type {
  CommonNodeViewProps,
  PreviewComponents,
} from "./NodeViewTypes";

// Inline node view: swaps its editor in place of the preview, inside the
// same wrapper, so editing never leaves the surrounding text.
export function InlineNodeView<TAttrs extends BaseAttrs>({
  node,
  selected,
  editor,
  ref,
  dataType,
  isEditing,
  ViewComponent,
  EditorComponent,
  updateAttributes,
  getPos,
  setIsEditing,
}: CommonNodeViewProps<TAttrs> & PreviewComponents<TAttrs>) {
  // Locks the node's wrapper to the preview's size so swapping to the editor doesn't shift surrounding text
  const [lockedSize, setLockedSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const openEditor = () => {
    // pins the node to its current size so swapping to the editor
    // causes no visible jump
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setLockedSize({ width: rect.width, height: rect.height });

    // clears the NodeSelection so it stops showing its own outline
    // alongside the editor's own focus outline
    const pos = getPos();
    if (pos !== undefined) editor.commands.setTextSelection(pos);

    editor.commands.blur();
    setIsEditing(true);
  };

  const closeEditor = () => {
    setIsEditing(false);
    setLockedSize(null);
  };

  return (
    <NodeViewWrapper
      ref={ref}
      as="span"
      data-type={dataType}
      data-drag-handle=""
      draggable={!isEditing}
      contentEditable={false}
      className={
        "tiptap-react-node-view-draggable-item" +
        (selected ? " selected" : "") +
        (isEditing ? " editing" : "")
      }
      style={
        lockedSize
          ? ({
              "--locked-width": `${lockedSize.width}px`,
              "--locked-height": `${lockedSize.height}px`,
            } as React.CSSProperties)
          : undefined
      }
      onClick={() => {
        if (!isEditing) openEditor();
      }}
    >
      {isEditing ? (
        <EditorComponent
          node={node}
          updateAttributes={updateAttributes}
          closeEditor={closeEditor}
          anchorRef={ref}
        />
      ) : (
        <ViewComponent node={node} openEditor={openEditor} />
      )}
    </NodeViewWrapper>
  );
}
