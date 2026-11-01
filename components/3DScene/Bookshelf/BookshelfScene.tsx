"use client";

import type { NotebookSummary } from "@/types/Notebook";
import type { ShelfLayout } from "./ShelfLayout";
import { useState, useSyncExternalStore } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Edges, PerspectiveCamera } from "@react-three/drei";
import {
  AMBIENT_LIGHT_STRENGTH,
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
  ONE_ROW_SHELF_HEIGHT,
  ROW_HEIGHT_SHARE,
  SHELF_LIGHT_POSITION,
  SHELF_ROUGHNESS,
  SHELF_ROW_HEIGHT,
  SHELF_WIDTH_SHARE,
  WALL_COLOR,
  WALL_MARGIN_X,
  WALL_MARGIN_Y,
} from "./BookshelfLook";
import { ShelfNotebook } from "./ShelfNotebook";
import {
  getRowTop,
  getShelfLayout,
  getShelfNotebookPosition,
} from "./ShelfLayout";
import "./BookshelfScene.css";

type BookshelfSceneProps = {
  notebooks: NotebookSummary[];
  focusedNotebookId: string | null; // its link has keyboard focus
  onOpenNotebook: (notebookId: string) => void;
};

type BookshelfProps = BookshelfSceneProps & {
  layout: ShelfLayout;
};

type ShelfBoxProps = {
  size: [number, number, number];
  position: [number, number, number];
  color: string;
};

const LOOK_DOWN = (LOOK_DOWN_DEGREES * Math.PI) / 180;

// How sharp the shadows are, higher is sharper but slower to draw
const SHADOW_MAP_SIZE = 2048;

// Calls back when the window is resized, for the window size below
function subscribeToResize(onResize: () => void) {
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}

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
function Bookshelf({
  notebooks,
  focusedNotebookId,
  layout,
  onOpenNotebook,
}: BookshelfProps) {
  const { width, height, rows } = layout;
  const canvasSize = useThree((state) => state.size);
  const pixelsPerUnit = (canvasSize.height - 2 * WALL_MARGIN_Y) / height;

  // far enough back that the canvas shows its own height at the shelf's front
  const viewHeight = canvasSize.height / pixelsPerUnit;
  const cameraDistance =
    viewHeight / 2 / Math.tan(((CAMERA_VIEW_DEGREES / 2) * Math.PI) / 180);

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
        makeDefault
        fov={CAMERA_VIEW_DEGREES}
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

      {/* the wall the shelf hangs on */}
      <mesh position={[0, 0, -SHELF_DEPTH - 0.02]} receiveShadow>
        <planeGeometry args={[width + 4, height + 4]} />
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
          onOpen={() => onOpenNotebook(notebook.id)}
        />
      ))}
    </>
  );
}

// The library's bookshelf drawn in 3D, in its own canvas. It has rows for
// all the notebooks, and the canvas grows to fit them. It fades in once
// the 3D is ready, instead of popping in
export function BookshelfScene({
  notebooks,
  focusedNotebookId,
  onOpenNotebook,
}: BookshelfSceneProps) {
  const [isReady, setIsReady] = useState(false);
  const windowWidth = useSyncExternalStore(
    subscribeToResize,
    () => window.innerWidth,
  );
  const windowHeight = useSyncExternalStore(
    subscribeToResize,
    () => window.innerHeight,
  );

  // every row is as big on screen as a one-row shelf would be
  const pixelsPerUnit =
    (windowHeight * ROW_HEIGHT_SHARE) / ONE_ROW_SHELF_HEIGHT;
  const shelfPixelWidth = windowWidth * SHELF_WIDTH_SHARE;
  const layout = getShelfLayout(
    shelfPixelWidth / pixelsPerUnit,
    notebooks.length,
  );

  return (
    <div
      className="bookshelf-scene"
      data-ready={isReady}
      style={
        {
          "--scene-width": `${shelfPixelWidth + 2 * WALL_MARGIN_X}px`,
          "--scene-height": `${
            layout.height * pixelsPerUnit + 2 * WALL_MARGIN_Y
          }px`,
        } as React.CSSProperties
      }
    >
      {/* flat keeps the real colors, and demand draws only when something
          changes, like the carousel. Variance shadows blur smoothly at their
          edges, without the grain of other soft shadows */}
      <Canvas
        flat
        shadows="variance"
        frameloop="demand"
        dpr={[1, 2]}
        onCreated={() => setIsReady(true)}
      >
        <ambientLight intensity={AMBIENT_LIGHT_STRENGTH} />
        <Bookshelf
          notebooks={notebooks}
          focusedNotebookId={focusedNotebookId}
          layout={layout}
          onOpenNotebook={onOpenNotebook}
        />
      </Canvas>
    </div>
  );
}
