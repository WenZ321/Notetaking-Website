import type { PerspectiveCamera as PerspectiveCameraType } from "three";
import type { NotebookSummary } from "@/types/Notebook";
import type { ShelfLayout } from "./ShelfLayout";
import type { Material } from "three";
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
  SURROUND_FADE_MS,
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

// A notebook being opened: when it was chosen, where the shelf was on
// screen then, where the notebook view will draw its cover, which it lands
// on, and when its flight down to the table started, null while it slides out
export type Opening = {
  notebookId: string;
  startedAt: number;
  shelfRect: DOMRect;
  landingRect: DOMRect;
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

// How far the view's middle is moved so what the camera aims at shows up
// in the middle of this box on screen, in a picture fullWidth by fullHeight
function getViewOffset(rect: DOMRect, fullWidth: number, fullHeight: number) {
  return {
    x: fullWidth / 2 - (rect.x + rect.width / 2),
    y: fullHeight / 2 - (rect.y + rect.height / 2),
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
  const invalidate = useThree((state) => state.invalidate);
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
    const shelfOffset = getViewOffset(opening.shelfRect, fullWidth, fullHeight);
    camera.setViewOffset(
      fullWidth,
      fullHeight,
      shelfOffset.x,
      shelfOffset.y,
      canvasSize.width,
      canvasSize.height,
    );
  }, [opening, fullWidth, fullHeight, canvasSize, fieldOfView]);

  // The wall behind the shelf covers exactly the shelf's spot on the page.
  // It sits behind the shelf, so it's a little bigger to look the same size,
  // and a little lower, where the tipped down camera sees through
  const wallDistanceScale = (cameraDistance + SHELF_DEPTH) / cameraDistance;
  const shelfSpot = opening?.shelfRect ?? canvasSize;
  const wallCenter: [number, number, number] = [
    0,
    -SHELF_DEPTH * Math.tan(LOOK_DOWN),
    -SHELF_DEPTH - 0.02,
  ];
  const wallSize: [number, number] = [
    (shelfSpot.width / pixelsPerUnit) * wallDistanceScale,
    (shelfSpot.height / pixelsPerUnit) * wallDistanceScale,
  ];

  // Once the flight starts, the rest of the wall and the table fade in over
  // the page from see-through, while the notebook moves down
  const surroundRef = useRef<Material>(null);
  const tableRef = useRef<Material>(null);
  useFrame(() => {
    if (opening?.flightStartedAt == null) return;
    const progress = Math.min(
      1,
      (performance.now() - opening.flightStartedAt) / SURROUND_FADE_MS,
    );
    const opacity = easeInOutQuart(progress);
    if (surroundRef.current) surroundRef.current.opacity = opacity;
    if (tableRef.current) tableRef.current.opacity = opacity;
    if (progress < 1) invalidate();
  });

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
  // enough up that the notebook is as tall on screen as the notebook view's
  // cover. The view's middle then moves onto the cover's box, so the
  // notebook lies exactly where the cover will be drawn
  const tableTop = -height / 2 - TABLE_BELOW_SHELF;
  const landedAt: [number, number, number] = [
    0,
    tableTop + SHELF_NOTEBOOK_THICKNESS / 2,
    TABLE_IN_FRONT,
  ];
  const landedTop = tableTop + SHELF_NOTEBOOK_THICKNESS;
  const viewHalfAngle = ((fieldOfView / 2) * Math.PI) / 180;
  const landingHeight = opening?.landingRect.height ?? canvasSize.height;
  const landedCameraHeight =
    ((NOTEBOOK_HEIGHT * fullHeight) / landingHeight) /
    2 /
    Math.tan(viewHalfAngle);
  const cameraStart = new Vector3(
    0,
    cameraDistance * Math.tan(LOOK_DOWN),
    cameraDistance,
  );
  const cameraEnd = new Vector3(
    0,
    landedTop + landedCameraHeight,
    TABLE_IN_FRONT,
  );

  // During the flight the camera moves above the table while it keeps its
  // eye on the notebook. It starts aimed at the shelf's middle, where it was
  // already looking, and its aim slides onto the notebook as it flies down,
  // while the view's middle moves from the shelf's box to the cover's box
  useFrame(() => {
    const camera = cameraRef.current;
    if (!camera || opening?.flightStartedAt == null || !slidOutAt) return;
    const startedAt = opening.flightStartedAt;
    const shelfOffset = getViewOffset(opening.shelfRect, fullWidth, fullHeight);
    const landingOffset = getViewOffset(
      opening.landingRect,
      fullWidth,
      fullHeight,
    );

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
      shelfOffset.x + (landingOffset.x - shelfOffset.x) * eased,
      shelfOffset.y + (landingOffset.y - shelfOffset.y) * eased,
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

      {/* the wall the shelf hangs on, over the shelf's spot on the page */}
      <mesh position={wallCenter} receiveShadow>
        <planeGeometry args={wallSize} />
        <meshStandardMaterial color={WALL_COLOR} roughness={1} />
      </mesh>

      {/* the rest of the wall, just behind it, fading in while opening */}
      {opening && (
        <mesh position={[0, 0, -SHELF_DEPTH - 0.04]} receiveShadow>
          <planeGeometry args={[width + 40, height + 40]} />
          <meshStandardMaterial
            ref={surroundRef}
            color={WALL_COLOR}
            roughness={1}
            transparent
            opacity={0}
          />
        </mesh>
      )}

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
          openingStartedAt={
            notebook.id === opening?.notebookId ? opening.startedAt : null
          }
          isFlying={
            notebook.id === opening?.notebookId &&
            opening.flightStartedAt !== null
          }
          onOpen={() => onChooseNotebook(notebook.id)}
        />
      ))}

      {/* the table, only there while opening, fading in with the wall */}
      {opening && (
        <mesh
          position={[0, tableTop - TABLE_SIZE[1] / 2, TABLE_IN_FRONT]}
          receiveShadow
        >
          <boxGeometry args={TABLE_SIZE} />
          <meshStandardMaterial
            ref={tableRef}
            color={TABLE_COLOR}
            roughness={SHELF_ROUGHNESS}
            transparent
            opacity={0}
          />
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
