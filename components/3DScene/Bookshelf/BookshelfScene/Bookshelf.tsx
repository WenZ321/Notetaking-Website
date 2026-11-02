import type { NotebookSummary } from "@/types/Notebook";
import type { ShelfLayout } from "../ShelfLayout";
import type { Opening } from "./OpeningPath";
import type { DirectionalLight } from "three";
import { useRef } from "react";
import { Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { MAIN_LIGHT_STRENGTH } from "../../NotebookModel/NotebookLook";
import { easeInOutQuart } from "../../EasingStep";
import {
  CAMERA_VIEW_DEGREES,
  LOOK_DOWN_DEGREES,
  OPEN_FLIGHT_MS,
  SHADOW_SOFTNESS,
  SHELF_DEPTH,
  SHELF_LIGHT_POSITION,
  TABLE_BELOW_SHELF,
  TABLE_LIGHT_POSITION,
  WALL_COLOR,
  WALL_MARGIN_Y,
} from "../BookshelfLook";
import { ShelfFurniture } from "../ShelfFurniture";
import { ShelfNotebook } from "../ShelfNotebook";
import { getShelfNotebookPosition } from "../ShelfLayout";
import { OpeningScenery } from "./OpeningScenery";
import { getLandedPosition, getSlidOutPosition } from "./OpeningPath";
import { ShelfCamera } from "./ShelfCamera";

type BookshelfProps = {
  notebooks: NotebookSummary[];
  layout: ShelfLayout;
  focusedNotebookId: string | null; // its link has keyboard focus
  opening: Opening | null;
  onChooseNotebook: (notebookId: string) => void;
};

const LOOK_DOWN = (LOOK_DOWN_DEGREES * Math.PI) / 180;

// How sharp the shadows are, higher is sharper but slower to draw
const SHADOW_MAP_SIZE = 2048;

const SHELF_LIGHT = new Vector3(...SHELF_LIGHT_POSITION);
const TABLE_LIGHT = new Vector3(...TABLE_LIGHT_POSITION);

// How much light falls on a surface facing straight up, from 0 to 1. A
// light more overhead lights the table more, so it's dimmed to keep the
// table and the landed cover the same colors as the page that follows
const SHELF_LIGHT_ON_TABLE = SHELF_LIGHT.clone().normalize().y;

// The shelf, its notebooks, and the wall behind them. The camera sits so
// the shelf's front is as tall on screen as the canvas minus its margins
export function Bookshelf({
  notebooks,
  layout,
  focusedNotebookId,
  opening,
  onChooseNotebook,
}: BookshelfProps) {
  const { width, height } = layout;
  const canvasSize = useThree((state) => state.size);

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

  const openingIndex = notebooks.findIndex(
    (notebook) => notebook.id === opening?.notebookId,
  );
  const slidOutAt =
    openingIndex === -1 ? null : getSlidOutPosition(openingIndex, layout);
  const landedAt = getLandedPosition(height);

  // the light moves above the table along with the notebook's flight
  const lightRef = useRef<DirectionalLight>(null);
  useFrame(() => {
    const light = lightRef.current;
    if (!light || opening?.flightStartedAt == null) return;
    const progress = Math.min(
      1,
      (performance.now() - opening.flightStartedAt) / OPEN_FLIGHT_MS,
    );
    light.position.lerpVectors(SHELF_LIGHT, TABLE_LIGHT, easeInOutQuart(progress));
    const lightOnTable = light.position.clone().normalize().y;
    light.intensity =
      (MAIN_LIGHT_STRENGTH * SHELF_LIGHT_ON_TABLE) / lightOnTable;
  });

  return (
    <>
      <ShelfCamera
        cameraDistance={cameraDistance}
        pixelsPerUnit={pixelsPerUnit}
        opening={opening}
        slidOutAt={slidOutAt}
        landedAt={landedAt}
      />

      {/* the light casts shadows over the whole shelf and the wall around
          it. The bias stops surfaces from wrongly shadowing themselves */}
      <directionalLight
        ref={lightRef}
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

      <ShelfFurniture layout={layout} />

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

      {opening && slidOutAt && (
        <OpeningScenery
          notebook={notebooks[openingIndex]}
          layout={layout}
          flightStartedAt={opening.flightStartedAt}
          slidOutAt={slidOutAt}
          landedAt={landedAt}
        />
      )}
    </>
  );
}
