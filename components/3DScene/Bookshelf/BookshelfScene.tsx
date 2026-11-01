"use client";

import type { NotebookSummary } from "@/types/Notebook";
import { useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Edges, PerspectiveCamera } from "@react-three/drei";
import {
  AMBIENT_LIGHT_STRENGTH,
  MAIN_LIGHT_STRENGTH,
  NOTEBOOK_HEIGHT,
  NOTEBOOK_WIDTH,
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
  SHELF_END_SPACE,
  SHELF_HEIGHT,
  SHELF_LIGHT_POSITION,
  SHELF_NOTEBOOK_GAP,
  SHELF_NOTEBOOK_THICKNESS,
  SHELF_ROUGHNESS,
  WALL_COLOR,
  WALL_MARGIN_X,
  WALL_MARGIN_Y,
} from "./BookshelfLook";
import { ShelfNotebook } from "./ShelfNotebook";
import "./BookshelfScene.css";

type BookshelfSceneProps = {
  notebooks: NotebookSummary[];
};

type ShelfBoxProps = {
  size: [number, number, number];
  position: [number, number, number];
  color: string;
};

const LOOK_DOWN = (LOOK_DOWN_DEGREES * Math.PI) / 180;

// Where the shelf's inside starts, its floor
const SHELF_FLOOR = -SHELF_HEIGHT / 2 + SHELF_BOARD_THICKNESS;

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
// the shelf's front is as tall on screen as the canvas minus its margins,
// and the shelf is as wide as the canvas minus its margins
function Bookshelf({ notebooks }: BookshelfSceneProps) {
  const canvasSize = useThree((state) => state.size);
  const pixelsPerUnit = (canvasSize.height - 2 * WALL_MARGIN_Y) / SHELF_HEIGHT;
  const shelfWidth = (canvasSize.width - 2 * WALL_MARGIN_X) / pixelsPerUnit;

  // far enough back that the canvas shows its own height at the shelf's front
  const viewHeight = canvasSize.height / pixelsPerUnit;
  const cameraDistance =
    viewHeight / 2 / Math.tan(((CAMERA_VIEW_DEGREES / 2) * Math.PI) / 180);

  const boardMiddle = SHELF_BOARD_THICKNESS / 2;
  const depthMiddle = -SHELF_DEPTH / 2;

  // the first notebook's middle, just inside the left board
  const firstNotebookX =
    -shelfWidth / 2 +
    SHELF_BOARD_THICKNESS +
    SHELF_END_SPACE +
    SHELF_NOTEBOOK_THICKNESS / 2;

  return (
    <>
      {/* raised and tipped down, still pointing at the shelf's middle */}
      <PerspectiveCamera
        makeDefault
        fov={CAMERA_VIEW_DEGREES}
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
        shadow-camera-left={-shelfWidth / 2 - 2}
        shadow-camera-right={shelfWidth / 2 + 2}
        shadow-camera-top={SHELF_HEIGHT + 2}
        shadow-camera-bottom={-SHELF_HEIGHT - 2}
      />

      {/* the wall the shelf hangs on */}
      <mesh position={[0, 0, -SHELF_DEPTH - 0.02]} receiveShadow>
        <planeGeometry args={[shelfWidth + 4, SHELF_HEIGHT + 4]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={1} />
      </mesh>

      {/* bottom, top, left and right boards, then the back */}
      <ShelfBox
        size={[shelfWidth, SHELF_BOARD_THICKNESS, SHELF_DEPTH]}
        position={[0, -SHELF_HEIGHT / 2 + boardMiddle, depthMiddle]}
        color={SHELF_BOARD_COLOR}
      />
      <ShelfBox
        size={[shelfWidth, SHELF_BOARD_THICKNESS, SHELF_DEPTH]}
        position={[0, SHELF_HEIGHT / 2 - boardMiddle, depthMiddle]}
        color={SHELF_BOARD_COLOR}
      />
      <ShelfBox
        size={[SHELF_BOARD_THICKNESS, SHELF_HEIGHT, SHELF_DEPTH]}
        position={[-shelfWidth / 2 + boardMiddle, 0, depthMiddle]}
        color={SHELF_BOARD_COLOR}
      />
      <ShelfBox
        size={[SHELF_BOARD_THICKNESS, SHELF_HEIGHT, SHELF_DEPTH]}
        position={[shelfWidth / 2 - boardMiddle, 0, depthMiddle]}
        color={SHELF_BOARD_COLOR}
      />
      <ShelfBox
        size={[shelfWidth, SHELF_HEIGHT, 0.02]}
        position={[0, 0, -SHELF_DEPTH]}
        color={SHELF_BACK_COLOR}
      />

      {/* notebooks stand on the floor, their spines near its front edge */}
      {notebooks.map((notebook, index) => (
        <ShelfNotebook
          key={notebook.id}
          notebook={notebook}
          position={[
            firstNotebookX +
              index * (SHELF_NOTEBOOK_THICKNESS + SHELF_NOTEBOOK_GAP),
            SHELF_FLOOR + NOTEBOOK_HEIGHT / 2,
            -NOTEBOOK_WIDTH / 2 - 0.03,
          ]}
        />
      ))}
    </>
  );
}

// The library's bookshelf drawn in 3D, in its own canvas. It fades in once
// the 3D is ready, instead of popping in
export function BookshelfScene({ notebooks }: BookshelfSceneProps) {
  const [isReady, setIsReady] = useState(false);

  return (
    <div
      className="bookshelf-scene"
      data-ready={isReady}
      style={
        {
          "--wall-margin-x": `${WALL_MARGIN_X}px`,
          "--wall-margin-y": `${WALL_MARGIN_Y}px`,
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
        <Bookshelf notebooks={notebooks} />
      </Canvas>
    </div>
  );
}
