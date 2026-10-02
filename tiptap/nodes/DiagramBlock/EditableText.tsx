import type { TextInfo, ShapeInfo, NodeSize } from "./DiagramBlockType";
import { Html } from "react-konva-utils";
import { Text } from "react-konva";
import { getOffset } from "./ShapeUtils";

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
            style={{
              position: "absolute",

              width: `${nodeSize.width}px`,
              height: `${nodeSize.height}px`,

              left: `${-offset.offsetX}px`,
              top: `${-offset.offsetY}px`,

              fontFamily: textInfo.family,
              fontSize: `${textInfo.size}px`,
              fontWeight: textInfo.bold ? "bold" : "normal",
              fontStyle: textInfo.italic ? "italic" : "normal",
              textDecoration: textInfo.underline ? "underline" : "none",

              color: textInfo.color,

              textAlign: "center",

              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",

              padding: 0,
              overflow: "hidden",
            }}
          />
        </Html>
      )}
    </>
  );
}
