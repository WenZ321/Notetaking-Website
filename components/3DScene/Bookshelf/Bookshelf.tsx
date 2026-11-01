import type { PerspectiveCamera as PerspectiveCameraType } from "three";
import type { NotebookSummary } from "@/types/Notebook";
import type { ShelfLayout } from "./ShelfLayout";
import { useLayoutEffect, useRef } from "react";
import { Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Edges, PerspectiveCamera } from "@react-three/drei";
import {
  MAIN_LIGHT_STRENGTH,
  NOTEBOOK_HEIGHT,
  OUTLINE_WIDTH,
} from "../NotebookModel/NotebookLook";
import { easeInOutQuart } from "../EasingStep";
import {
  CAMERA_VIEW_DEGREES,
  LANDED_SCREEN_SHARE,
  LOOK_DOWN_DEGREES,
  OPEN_FLIGHT_MS,
  OPEN_SLIDE,
  PULL_OUT_LIFT,
  SHADOW_SOFTNESS,
  SHELF_BACK_COLOR,
  SHELF_BOARD_COLOR,
  SHELF_BOARD_THICKNESS,
  SHELF_DEPTH,
  SHELF_EDGE_COLOR,
  SHELF_LIGHT_POSITION,
  SHELF_NOTEBOOK_THICKNESS,
  SHELF_ROUGHNESS,
  SHELF_ROW_HEIGHT,
  TABLE_BELOW_SHELF,
  TABLE_COLOR,
  TABLE_IN_FRONT,
  TABLE_SIZE,
  WALL_COLOR,
  WALL_MARGIN_Y,
} from "./BookshelfLook";
import { FlyingNotebook } from "./FlyingNotebook";
import { ShelfNotebook } from "./ShelfNotebook";
import { getRowTop, getShelfNotebookPosition } from "./ShelfLayout";

// A notebook being opened, where the shelf was on screen when it started,
// and when its flight down to the table started, null while it slides out
export type Opening = {
  notebookId: string;
  shelfRect: DOMRect;
  flightStartedAt: number | null;
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

// Where the camera looks before opening, and which way is up for it while
// it flies, leaning away from the shelf so looking straight down still has
// a clear up
const SHELF_MIDDLE = new Vector3(0, 0, 0);
const CAMERA_UP = new Vector3(0, 1, -1).normalize();

// How sharp the shadows are, higher is sharper but slower to draw
const SHADOW_MAP_SIZE = 2048;

// How far the view's middle is moved so the shelf's middle lands where it
// was on screen, in a picture fullWidth by fullHeight
function getShelfOffset(
  shelfRect: DOMRect,
  fullWidth: number,
  fullHeight: number,
) {
  return {
    x: fullWidth / 2 - (shelfRect.x + shelfRect.width / 2),
    y: fullHeight / 2 - (shelfRect.y + shelfRect.height / 2),
  };
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

  // where the view's middle ends while opening, on the window's middle
  const centeredOffset = {
    x: (fullWidth - canvasSize.width) / 2,
    y: (fullHeight - canvasSize.height) / 2,
  };

  useLayoutEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    if (!opening) {
      camera.clearViewOffset();
      return;
    }
    const shelfOffset = getShelfOffset(opening.shelfRect, fullWidth, fullHeight);
    camera.setViewOffset(
      fullWidth,
      fullHeight,
      shelfOffset.x,
      shelfOffset.y,
      canvasSize.width,
      canvasSize.height,
    );
  }, [opening, fullWidth, fullHeight, canvasSize, fieldOfView]);

  // the chosen notebook's middle once it has slid out of the shelf
  const openingIndex = notebooks.findIndex(
    (notebook) => notebook.id === opening?.notebookId,
  );
  const slidOutAt = (() => {
    if (openingIndex === -1) return null;
    const [x, y, z] = getShelfNotebookPosition(openingIndex, layout);
    return [x, y + PULL_OUT_LIFT, z + OPEN_SLIDE] as [number, number, number];
  })();

  // The table sits below and in front of the shelf. The chosen notebook
  // lands in the middle of it, and the camera ends straight above it, far
  // enough up that the notebook is LANDED_SCREEN_SHARE of the window tall
  const tableTop = -height / 2 - TABLE_BELOW_SHELF;
  const landedAt: [number, number, number] = [
    0,
    tableTop + SHELF_NOTEBOOK_THICKNESS / 2,
    TABLE_IN_FRONT,
  ];
  const viewHalfAngle = ((fieldOfView / 2) * Math.PI) / 180;
  const landedCameraHeight =
    ((NOTEBOOK_HEIGHT / LANDED_SCREEN_SHARE) * (fullHeight / canvasSize.height)) /
    2 /
    Math.tan(viewHalfAngle);
  const cameraStart = new Vector3(
    0,
    cameraDistance * Math.tan(LOOK_DOWN),
    cameraDistance,
  );
  const cameraEnd = new Vector3(
    0,
    landedAt[1] + landedCameraHeight,
    TABLE_IN_FRONT,
  );

  // During the flight the camera moves above the table while it keeps its
  // eye on the notebook. It starts aimed at the shelf's middle, where it was
  // already looking, and its aim slides onto the notebook as it flies down,
  // while the view's middle moves from the shelf's middle to the window's
  useFrame(() => {
    const camera = cameraRef.current;
    if (!camera || opening?.flightStartedAt == null || !slidOutAt) return;
    const startedAt = opening.flightStartedAt;
    const shelfOffset = getShelfOffset(opening.shelfRect, fullWidth, fullHeight);

    const progress = Math.min(1, (performance.now() - startedAt) / OPEN_FLIGHT_MS);
    const eased = easeInOutQuart(progress);
    const notebookAt = new Vector3().lerpVectors(
      new Vector3(...slidOutAt),
      new Vector3(...landedAt),
      eased,
    );
    const aim = new Vector3().lerpVectors(SHELF_MIDDLE, notebookAt, eased);

    // up leans away from the shelf, so the camera never spins as it ends up
    // looking straight down
    camera.up.copy(CAMERA_UP);
    camera.position.lerpVectors(cameraStart, cameraEnd, eased);
    camera.lookAt(aim);
    camera.setViewOffset(
      fullWidth,
      fullHeight,
      shelfOffset.x + (centeredOffset.x - shelfOffset.x) * eased,
      shelfOffset.y + (centeredOffset.y - shelfOffset.y) * eased,
      canvasSize.width,
      canvasSize.height,
    );
  });


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
          which keeps close surfaces like a title and its spine apart. While
          opening it sees further, since it moves out to the table */}
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={fieldOfView}
        near={opening ? 0.3 : cameraDistance - 2}
        far={opening ? cameraDistance + 20 : cameraDistance + SHELF_DEPTH + 2}
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
        shadow-camera-bottom={-height / 2 - TABLE_BELOW_SHELF - 4}
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
          isFlying={
            notebook.id === opening?.notebookId &&
            opening.flightStartedAt !== null
          }
          onOpen={() => onChooseNotebook(notebook.id)}
        />
      ))}

      {/* the table, only there while opening */}
      {opening && (
        <mesh
          position={[0, tableTop - TABLE_SIZE[1] / 2, TABLE_IN_FRONT]}
          receiveShadow
        >
          <boxGeometry args={TABLE_SIZE} />
          <meshStandardMaterial color={TABLE_COLOR} roughness={SHELF_ROUGHNESS} />
        </mesh>
      )}

      {opening?.flightStartedAt != null && slidOutAt && (
        <FlyingNotebook
          notebook={notebooks[openingIndex]}
          from={slidOutAt}
          to={landedAt}
          startedAt={opening.flightStartedAt}
        />
      )}
    </>
  );
}
