import type { PerspectiveCamera as PerspectiveCameraType } from "three";
import type { NotebookSummary } from "@/types/Notebook";
import type { ShelfLayout } from "./ShelfLayout";
import { useLayoutEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Edges, PerspectiveCamera } from "@react-three/drei";
import {
  MAIN_LIGHT_STRENGTH,
  OUTLINE_WIDTH,
} from "../NotebookModel/NotebookLook";
import {
  CAMERA_VIEW_DEGREES,
  LOOK_DOWN_DEGREES,
  SHADOW_SOFTNESS,
  SHELF_BACK_COLOR,
  SHELF_BOARD_COLOR,
  SHELF_BOARD_THICKNESS,
  SHELF_DEPTH,
  SHELF_EDGE_COLOR,
  SHELF_LIGHT_POSITION,
  SHELF_ROUGHNESS,
  SHELF_ROW_HEIGHT,
  WALL_COLOR,
  WALL_MARGIN_Y,
} from "./BookshelfLook";
import { ShelfNotebook } from "./ShelfNotebook";
import { getRowTop, getShelfNotebookPosition } from "./ShelfLayout";

// A notebook being opened, and where the shelf was on screen when it started
export type Opening = {
  notebookId: string;
  shelfRect: DOMRect;
};

type BookshelfProps = {
  notebooks: NotebookSummary[];
  layout: ShelfLayout;
  focusedNotebookId: string | null; // its link has keyboard focus
  opening: Opening | null;
  onChooseNotebook: (notebookId: string) => void;
};

type ShelfBoxProps = {
  size: [number, number, number];
  position: [number, number, number];
  color: string;
};

const LOOK_DOWN = (LOOK_DOWN_DEGREES * Math.PI) / 180;

// How sharp the shadows are, higher is sharper but slower to draw
const SHADOW_MAP_SIZE = 2048;

function ShelfBox({ size, position, color }: ShelfBoxProps) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={SHELF_ROUGHNESS} />
      <Edges lineWidth={OUTLINE_WIDTH / 2} color={SHELF_EDGE_COLOR} />
    </mesh>
  );
}

// The shelf, its notebooks, and the wall behind them. The camera sits so
// the shelf's front is as tall on screen as the canvas minus its margins
export function Bookshelf({
  notebooks,
  layout,
  focusedNotebookId,
  opening,
  onChooseNotebook,
}: BookshelfProps) {
  const { width, height, rows } = layout;
  const canvasSize = useThree((state) => state.size);
  const cameraRef = useRef<PerspectiveCameraType>(null);

  // While opening, the canvas covers the window, but the shelf is drawn
  // exactly where it was. The camera keeps its distance and the shelf's
  // size, its view widens to the window, and its middle is moved to where
  // the shelf's middle was
  const shelfBoxHeight = opening?.shelfRect.height ?? canvasSize.height;
  const pixelsPerUnit = (shelfBoxHeight - 2 * WALL_MARGIN_Y) / height;
  const cameraDistance =
    shelfBoxHeight /
    pixelsPerUnit /
    2 /
    Math.tan(((CAMERA_VIEW_DEGREES / 2) * Math.PI) / 180);

  // the view is worked out as if for a picture three times the window, so
  // the window's part of it can be moved anywhere in it
  const fullWidth = canvasSize.width * 3;
  const fullHeight = canvasSize.height * 3;
  const fieldOfView = opening
    ? (2 * Math.atan(fullHeight / pixelsPerUnit / 2 / cameraDistance) * 180) /
      Math.PI
    : CAMERA_VIEW_DEGREES;

  useLayoutEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    if (!opening) {
      camera.clearViewOffset();
      return;
    }
    const { shelfRect } = opening;
    const shelfMiddleX = shelfRect.x + shelfRect.width / 2;
    const shelfMiddleY = shelfRect.y + shelfRect.height / 2;
    camera.setViewOffset(
      fullWidth,
      fullHeight,
      fullWidth / 2 - shelfMiddleX,
      fullHeight / 2 - shelfMiddleY,
      canvasSize.width,
      canvasSize.height,
    );
  }, [opening, fullWidth, fullHeight, canvasSize, fieldOfView]);

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
      {/* raised and tipped down, still pointing at the shelf's middle. It
          only sees from just in front of the shelf to just past the wall,
          which keeps close surfaces like a title and its spine apart */}
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={fieldOfView}
        near={cameraDistance - 2}
        far={cameraDistance + SHELF_DEPTH + 2}
        position={[0, cameraDistance * Math.tan(LOOK_DOWN), cameraDistance]}
        rotation={[-LOOK_DOWN, 0, 0]}
      />

      {/* the light casts shadows over the whole shelf and the wall around
          it. The bias stops surfaces from wrongly shadowing themselves */}
      <directionalLight
        position={SHELF_LIGHT_POSITION}
        intensity={MAIN_LIGHT_STRENGTH}
        castShadow
        shadow-mapSize={[SHADOW_MAP_SIZE, SHADOW_MAP_SIZE]}
        shadow-normalBias={0.02}
        shadow-radius={SHADOW_SOFTNESS}
        shadow-blurSamples={16}
        shadow-camera-left={-width / 2 - 2}
        shadow-camera-right={width / 2 + 2}
        shadow-camera-top={height / 2 + 2}
        shadow-camera-bottom={-height / 2 - 2}
      />

      {/* the wall the shelf hangs on, big enough to fill the window while
          opening */}
      <mesh position={[0, 0, -SHELF_DEPTH - 0.02]} receiveShadow>
        <planeGeometry args={[width + 40, height + 40]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={1} />
      </mesh>

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

      {notebooks.map((notebook, index) => (
        <ShelfNotebook
          key={notebook.id}
          notebook={notebook}
          position={getShelfNotebookPosition(index, layout)}
          isFocused={notebook.id === focusedNotebookId}
          isOpening={notebook.id === opening?.notebookId}
          onOpen={() => onChooseNotebook(notebook.id)}
        />
      ))}
    </>
  );
}
