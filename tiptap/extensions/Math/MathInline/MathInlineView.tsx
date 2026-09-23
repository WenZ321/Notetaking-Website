import type { ReactNodeViewProps } from "@tiptap/react";
import type { MathAttrs } from "../MathType";
import { useEffect, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import { MathInlinePreview } from "./MathInlinePreview";
import { MathInlineEditor } from "./MathInlineEditor";
import "./MathInlineView.css";

// Inline math's node view. Clicking it swaps the spot into a live mathlive
// input with a keyboard popover below, instead of opening a modal.
export function MathInlineView(props: ReactNodeViewProps) {
  const { node, updateAttributes, editor, selected, ref, getPos } = props;
  const attrs = node.attrs as MathAttrs;
  // narrows updateAttributes to only accept known MathAttrs keys
  const typedUpdateAttributes = updateAttributes as (
    attrs: Partial<MathAttrs>,
  ) => void;

  const [isEditing, setIsEditing] = useState(false);
  const [latex, setLatex] = useState(attrs.latex);
  const [lockedSize, setLockedSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // prevents ProseMirror from replacing this node while it's selected and being edited
  useEffect(() => {
    editor.setEditable(!isEditing);

    return () => {
      editor.setEditable(true);
    };
  }, [editor, isEditing]);

  const closeEditor = () => {
    typedUpdateAttributes({ latex });
    setIsEditing(false);
    setLockedSize(null);
  };

  const openEditor = () => {
    // re-seeds the draft in case an undo happened while not editing
    setLatex(attrs.latex);

    // pins the node to its current size so swapping to the mathfield
    // causes no visible jump
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setLockedSize({ width: rect.width, height: rect.height });

    // clears the NodeSelection so it stops showing its own outline
    // alongside the mathfield's focus outline
    const pos = getPos();
    if (pos !== undefined) editor.commands.setTextSelection(pos);

    editor.commands.blur();
    setIsEditing(true);
  };

  // close on a click outside the node, or Escape
  useEffect(() => {
    if (!isEditing) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) closeEditor();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeEditor();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, latex]);

  return (
    <NodeViewWrapper
      ref={ref}
      as="span"
      data-type="math-inline"
      data-drag-handle=""
      draggable={!isEditing}
      contentEditable={false}
      className={
        "math-inline-preview tiptap-react-node-view-draggable-item" +
        (isEditing ? " editing" : "") +
        (selected ? " selected" : "")
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
        <MathInlineEditor latex={latex} onChange={setLatex} anchorRef={ref} />
      ) : (
        <MathInlinePreview latex={attrs.latex} />
      )}
    </NodeViewWrapper>
  );
}
