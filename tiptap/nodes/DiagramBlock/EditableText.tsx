import type { TextInfo, ShapeInfo, NodeSize } from "./DiagramBlockType";
import { Html } from "react-konva-utils";
import { Text } from "react-konva";
import { getOffset } from "./ShapeUtils";
import "./EditableText.css";

type EditableTextProps = {
  isEditing: boolean;
  nodeSize: NodeSize;
  shapeInfo: ShapeInfo;
  textInfo: TextInfo;
  updateText: (newText: string) => void;
};

// Renders a shape's text, swapping to an editable textarea overlay while being edited.
export function EditableText({
  isEditing,
  nodeSize,
  shapeInfo,
  textInfo,
  updateText,
}: EditableTextProps) {
  const offset = getOffset(shapeInfo);
  const textareaClassName = [
    "editable-text-textarea",
    textInfo.bold ? "bold" : "",
    textInfo.italic ? "italic" : "",
    textInfo.underline ? "underline" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <Text
        text={textInfo.text}
        fontSize={textInfo.size}
        fontFamily={textInfo.family}
        fontStyle={
          textInfo.bold && textInfo.italic
            ? "bold italic"
            : textInfo.bold
              ? "bold"
              : textInfo.italic
                ? "italic"
                : "normal"
        }
        textDecoration={textInfo.underline ? "underline" : ""}
        fill={textInfo.color}
        align="center"
        verticalAlign="middle"
        width={nodeSize.width}
        height={nodeSize.height}
        offsetX={offset.offsetX}
        offsetY={offset.offsetY}
        opacity={isEditing ? 0 : 1}
      />

      {isEditing && (
        <Html>
          <textarea
            autoFocus
            spellCheck={false}
            value={textInfo.text}
            onChange={(e) => updateText(e.target.value)}
            className={textareaClassName}
            style={
              {
                "--textarea-width": `${nodeSize.width}px`,
                "--textarea-height": `${nodeSize.height}px`,
                "--textarea-left": `${-offset.offsetX}px`,
                "--textarea-top": `${-offset.offsetY}px`,
                "--text-font-family": textInfo.family,
                "--text-font-size": `${textInfo.size}px`,
                "--text-color": textInfo.color,
              } as React.CSSProperties
            }
          />
        </Html>
      )}
    </>
  );
}
