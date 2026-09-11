import type { ShapeType } from "./DiagramBlockType";
import {
  Square,
  RectangleHorizontal,
  Circle,
  Diamond,
  Ellipse,
  Octagon,
  Hexagon,
  Cylinder,
} from "lucide-react";
import "./DiagramShapePalette.css";

type ShapePaletteProps = {
  addNode: (shapeType: ShapeType) => void;
};

const shapes: { type: ShapeType; icon: React.ElementType }[] = [
  { type: "square", icon: Square },
  { type: "rectangle", icon: RectangleHorizontal },
  { type: "circle", icon: Circle },
  { type: "diamond", icon: Diamond },
  { type: "ellipse", icon: Ellipse },
  { type: "octagon", icon: Octagon },
  { type: "hexagon", icon: Hexagon },
  { type: "cylinder", icon: Cylinder },
];

export function DiagramShapePalette({ addNode }: ShapePaletteProps) {
  // Eventually for dragging shapes onto the canvas
  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    type: string,
  ) => {
    e.dataTransfer.setData("shape", type);
    e.dataTransfer.effectAllowed = "move";

    const preview = document.createElement("div");
    preview.style.width = "40px";
    preview.style.height = "40px";
    preview.style.display = "flex";
    preview.style.alignItems = "center";
    preview.style.justifyContent = "center";

    const icon = e.currentTarget.querySelector("svg");

    if (icon) {
      preview.appendChild(icon.cloneNode(true));
    }

    document.body.appendChild(preview);

    e.dataTransfer.setDragImage(preview, 20, 20);

    setTimeout(() => {
      preview.remove();
    }, 0);
  };

  return (
    <div className="diagram-block-editor-shape-palette">
      <h3 className="diagram-block-editor-shape-palette-title"> Shapes </h3>

      <div className="diagram-block-editor-shape-palette-grid">
        {shapes.map(({ type, icon: Icon }) => (
          <button
            key={type}
            className="diagram-block-editor-shape-palette-button"
            onClick={() => addNode(type)}
            // draggable
            // onDragStart={(e) => {
            //   e.currentTarget.style.opacity = "0";
            //   handleDragStart(e, type);
            // }}
            // onDragEnd={(e) => {
            //   e.currentTarget.style.opacity = "1";
            // }}

            // TODO: Make this a draggable button that creates a temp view node when hovered over the canvas
          >
            <Icon />
          </button>
        ))}
      </div>
    </div>
  );
}
