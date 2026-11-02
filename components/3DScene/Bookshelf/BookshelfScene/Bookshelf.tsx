import type { NotebookSummary } from "@/types/Notebook";
import type { ShelfLayout } from "../ShelfLayout";
import type { Opening } from "./OpeningPath";
import type { DirectionalLight } from "three";
import { useEffect, useEffectEvent, useRef } from "react";
import { Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { MAIN_LIGHT_STRENGTH } from "../../NotebookModel/NotebookLook";
import { easeInOutQuart } from "../../EasingStep";
import {
  CAMERA_VIEW_DEGREES,
  LOOK_DOWN_DEGREES,
  SHADOW_SOFTNESS,
  SHELF_DEPTH,
  SHELF_LIGHT_POSITION,
  TABLE_BELOW_SHELF,
  WALL_MARGIN_Y,
} from "../BookshelfLook";
import { WALL_COLOR } from "../../TableFlight/TableFlightLook";
import {
  getFlightProgress,
  getLandedPosition,
  getWidthScale,
  moveLightTowardTable,
} from "../../TableFlight/TableFlightMotion";
import { OpeningScenery } from "../../TableFlight/OpeningScenery";
import { FlyingNotebook } from "../../TableFlight/FlyingNotebook";
import { ShelfFurniture } from "../ShelfFurniture";
import { ShelfNotebook } from "../ShelfNotebook";
import { getShelfNotebookPosition } from "../ShelfLayout";
import { getFlightStart, getSlidOutPosition, getTableTop } from "./OpeningPath";
import { ShelfCamera } from "./ShelfCamera";

type BookshelfProps = {
  notebooks: NotebookSummary[];
  layout: ShelfLayout;
  focusedNotebookId: string | null; // its link has keyboard focus
  opening: Opening | null;
  onChooseNotebook: (notebookId: string) => void;
  // called once an opening is drawn over the whole window
  onOpeningDrawn: () => void;
};

const LOOK_DOWN = (LOOK_DOWN_DEGREES * Math.PI) / 180;

// How sharp the shadows are, higher is sharper but slower to draw
const SHADOW_MAP_SIZE = 2048;

const SHELF_LIGHT = new Vector3(...SHELF_LIGHT_POSITION);

// The shelf, its notebooks, and the wall behind them. The camera sits so
// the shelf's front is as tall on screen as the canvas minus its margins
export function Bookshelf({
  notebooks,
  layout,
  focusedNotebookId,
  opening,
  onChooseNotebook,
  onOpeningDrawn,
}: BookshelfProps) {
  const { width, height } = layout;
  const canvasSize = useThree((state) => state.size);

  // the canvas grows to the window when an opening starts, which takes a
  // moment, so this waits for the first frame drawn at the window's size
  const isOpeningFullWindow =
    opening !== null &&
    canvasSize.width === window.innerWidth &&
    canvasSize.height === window.innerHeight;
  const handleOpeningDrawn = useEffectEvent(onOpeningDrawn);
  useEffect(() => {
    if (!isOpeningFullWindow) return;
    const frameId = requestAnimationFrame(handleOpeningDrawn);
    return () => cancelAnimationFrame(frameId);
  }, [isOpeningFullWindow]);

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

  // a notebook chosen on the shelf slides out of it before flying
  const shelfOpeningId =
    opening?.start.kind === "shelf" ? opening.notebook.id : null;
  const openingIndex = notebooks.findIndex(
    (notebook) => notebook.id === shelfOpeningId,
  );
  const slidOutAt =
    openingIndex === -1 ? null : getSlidOutPosition(openingIndex, layout);
  const flightStart =
    opening &&
    getFlightStart(opening, slidOutAt, cameraDistance, pixelsPerUnit);
  const tableTop = getTableTop(height);
  const landedAt = getLandedPosition(tableTop);

  // the light moves above the table along with the notebook's flight
  const lightRef = useRef<DirectionalLight>(null);
  useFrame(() => {
    const light = lightRef.current;
    if (!light || opening?.flightStartedAt == null) return;
    const progress = getFlightProgress(
      opening.flightStartedAt,
      opening.flightMs,
    );
    moveLightTowardTable(light, SHELF_LIGHT, easeInOutQuart(progress));
  });

  return (
    <>
      <ShelfCamera
        cameraDistance={cameraDistance}
        pixelsPerUnit={pixelsPerUnit}
        opening={opening}
        flightFrom={flightStart?.position ?? null}
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
            notebook.id === shelfOpeningId && opening ? opening.startedAt : null
          }
          isFlying={
            notebook.id === shelfOpeningId && opening?.flightStartedAt != null
          }
          onOpen={() => onChooseNotebook(notebook.id)}
        />
      ))}

      {/* the rest of the wall sits just behind the shelf's own spot */}
      {opening && (
        <OpeningScenery
          tableTop={tableTop}
          wallZ={-SHELF_DEPTH - 0.04}
          flightStartedAt={opening.flightStartedAt}
        />
      )}

      {/* it takes over from the shelf's copy or the popup's closed cover,
          which hide */}
      {opening?.flightStartedAt != null && flightStart && (
        <FlyingNotebook
          notebook={opening.notebook}
          from={flightStart.position}
          fromRotation={flightStart.rotation}
          to={landedAt}
          startedAt={opening.flightStartedAt}
          flightMs={opening.flightMs}
          fromWidthScale={flightStart.widthScale}
          landedWidthScale={getWidthScale(opening.landingRect)}
        />
      )}
    </>
  );
}
