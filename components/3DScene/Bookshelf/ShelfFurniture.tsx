import type { ShelfLayout } from "./ShelfLayout";
import { Edges } from "@react-three/drei";
import { OUTLINE_WIDTH } from "../NotebookModel/NotebookLook";
import {
  SHELF_BACK_COLOR,
  SHELF_BOARD_COLOR,
  SHELF_BOARD_THICKNESS,
  SHELF_DEPTH,
  SHELF_EDGE_COLOR,
  SHELF_ROUGHNESS,
  SHELF_ROW_HEIGHT,
} from "./BookshelfLook";
import { getRowTop } from "./ShelfLayout";

type ShelfFurnitureProps = {
  layout: ShelfLayout;
};

type ShelfBoxProps = {
  size: [number, number, number];
  position: [number, number, number];
  color: string;
};

function ShelfBox({ size, position, color }: ShelfBoxProps) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={SHELF_ROUGHNESS} />
      <Edges lineWidth={OUTLINE_WIDTH / 2} color={SHELF_EDGE_COLOR} />
    </mesh>
  );
}

// The shelf itself: a board over each row and under the last, the two
// sides, and the back
export function ShelfFurniture({ layout }: ShelfFurnitureProps) {
  const { width, height, rows } = layout;
  const boardMiddle = SHELF_BOARD_THICKNESS / 2;
  const depthMiddle = -SHELF_DEPTH / 2;

  // the top board, then the one under each row, the last being the bottom
  const boardHeights = [
    height / 2 - boardMiddle,
    ...Array.from(
      { length: rows },
      (_, row) => getRowTop(row, layout) - SHELF_ROW_HEIGHT - boardMiddle,
    ),
  ];

  return (
    <>
      {boardHeights.map((boardHeight) => (
        <ShelfBox
          key={boardHeight}
          size={[width, SHELF_BOARD_THICKNESS, SHELF_DEPTH]}
          position={[0, boardHeight, depthMiddle]}
          color={SHELF_BOARD_COLOR}
        />
      ))}

      {/* the left and right sides, then the back */}
      <ShelfBox
        size={[SHELF_BOARD_THICKNESS, height, SHELF_DEPTH]}
        position={[-width / 2 + boardMiddle, 0, depthMiddle]}
        color={SHELF_BOARD_COLOR}
      />
      <ShelfBox
        size={[SHELF_BOARD_THICKNESS, height, SHELF_DEPTH]}
        position={[width / 2 - boardMiddle, 0, depthMiddle]}
        color={SHELF_BOARD_COLOR}
      />
      <ShelfBox
        size={[width, height, 0.02]}
        position={[0, 0, -SHELF_DEPTH]}
        color={SHELF_BACK_COLOR}
      />
    </>
  );
}
