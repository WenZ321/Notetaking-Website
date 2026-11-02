import type { NotebookSummary } from "@/types/Notebook";
import type { ShelfLayout } from "../ShelfLayout";
import { Euler, Quaternion, Vector3 } from "three";
import { NOTEBOOK_HEIGHT } from "../../NotebookModel/NotebookLook";
import {
  LOOK_DOWN_DEGREES,
  OPEN_SLIDE,
  PULL_OUT_LIFT,
  SHELF_NOTEBOOK_THICKNESS,
  TABLE_BELOW_SHELF,
} from "../BookshelfLook";
import { getShelfNotebookPosition } from "../ShelfLayout";
import { getWidthScale } from "../../TableFlight/TableFlightMotion";

// Where the opening notebook comes from: a notebook chosen on the shelf,
// which slides out first, or a new one, whose cover just closed in the
// new notebook popup at coverRect on screen
export type OpeningStart =
  { kind: "shelf" } | { kind: "created"; coverRect: DOMRect };

// A notebook being opened: which one, where it comes from, when it was
// chosen, where the shelf was on screen then, where the notebook view will
// draw its cover, which it lands on, when its flight down to the table
// started, null while it slides out, and how long the flight takes
export type Opening = {
  notebook: NotebookSummary;
  start: OpeningStart;
  startedAt: number;
  shelfRect: DOMRect;
  landingRect: DOMRect;
  flightStartedAt: number | null;
  flightMs: number;
};

// Where the opening notebook's flight starts, how it's turned there, and how
// much wider it is there than its usual shape
export type FlightStart = {
  position: [number, number, number];
  rotation: Quaternion;
  widthScale: number;
};

const LOOK_DOWN = (LOOK_DOWN_DEGREES * Math.PI) / 180;

// Spine-out on the shelf, its spine facing you
const ON_SHELF = new Quaternion().setFromEuler(new Euler(0, Math.PI / 2, 0));

// Upright, tipped back to face the camera, which looks down at the shelf
const FACING_CAMERA = new Quaternion().setFromEuler(
  new Euler(-LOOK_DOWN, 0, 0),
);

// The chosen notebook's middle once it has slid out of the shelf
export function getSlidOutPosition(
  index: number,
  layout: ShelfLayout,
): [number, number, number] {
  const [x, y, z] = getShelfNotebookPosition(index, layout);
  return [x, y + PULL_OUT_LIFT, z + OPEN_SLIDE];
}

// The table's top sits below and in front of the shelf
export function getTableTop(shelfHeight: number) {
  return -shelfHeight / 2 - TABLE_BELOW_SHELF;
}

// Where a new notebook's middle is, so it shows up exactly over the closed
// cover on screen. The camera sits at cameraDistance, where pixelsPerUnit
// holds, with the shelf's middle shown in the middle of shelfRect. The
// cover is bigger than a shelf notebook, so it's that much closer
function getCoverStartPosition(
  coverRect: DOMRect,
  shelfRect: DOMRect,
  cameraDistance: number,
  pixelsPerUnit: number,
): [number, number, number] {
  const coverPixelsPerUnit = coverRect.height / NOTEBOOK_HEIGHT;
  const coverDistance = (cameraDistance * pixelsPerUnit) / coverPixelsPerUnit;

  // how far the cover's middle is from the shelf's middle on screen, in
  // scene units at the cover's distance. Screen y grows downward
  const right =
    (coverRect.x + coverRect.width / 2 - (shelfRect.x + shelfRect.width / 2)) /
    coverPixelsPerUnit;
  const up =
    (shelfRect.y +
      shelfRect.height / 2 -
      (coverRect.y + coverRect.height / 2)) /
    coverPixelsPerUnit;

  // the camera's spot and the ways it faces, tipped down at the shelf
  const camera = new Vector3(
    0,
    cameraDistance * Math.tan(LOOK_DOWN),
    cameraDistance,
  );
  const forward = new Vector3(0, -Math.sin(LOOK_DOWN), -Math.cos(LOOK_DOWN));
  const cameraUp = new Vector3(0, Math.cos(LOOK_DOWN), -Math.sin(LOOK_DOWN));

  // the cover's front sits at coverDistance, so its middle is half the
  // notebook's thickness further on
  const middle = camera
    .clone()
    .addScaledVector(forward, coverDistance + SHELF_NOTEBOOK_THICKNESS / 2)
    .add(new Vector3(right, 0, 0))
    .addScaledVector(cameraUp, up);
  return [middle.x, middle.y, middle.z];
}

// Where the opening notebook's flight starts: slid out of the shelf and
// spine-out, or over the popup's closed cover and facing the camera
export function getFlightStart(
  opening: Opening,
  slidOutAt: [number, number, number] | null,
  cameraDistance: number,
  pixelsPerUnit: number,
): FlightStart | null {
  switch (opening.start.kind) {
    case "shelf":
      return (
        slidOutAt && { position: slidOutAt, rotation: ON_SHELF, widthScale: 1 }
      );
    case "created":
      return {
        position: getCoverStartPosition(
          opening.start.coverRect,
          opening.shelfRect,
          cameraDistance,
          pixelsPerUnit,
        ),
        rotation: FACING_CAMERA,
        widthScale: getWidthScale(opening.start.coverRect),
      };
  }
}
