import type { DirectionalLight, PerspectiveCamera } from "three";
import { Vector3 } from "three";
import {
  MAIN_LIGHT_STRENGTH,
  NOTEBOOK_HEIGHT,
  NOTEBOOK_WIDTH,
} from "../NotebookModel/NotebookLook";
import { SHELF_NOTEBOOK_THICKNESS } from "../Bookshelf/BookshelfLook";
import { TABLE_IN_FRONT, TABLE_LIGHT_POSITION } from "./TableFlightLook";

const TABLE_LIGHT = new Vector3(...TABLE_LIGHT_POSITION);

// Which way is up for the camera while it flies, leaning away from the wall
// so looking straight down still has a clear up
const CAMERA_UP = new Vector3(0, 1, -1).normalize();

// How far along the flight is, from 0 to 1, not eased
export function getFlightProgress(flightStartedAt: number, flightMs: number) {
  return Math.min(1, (performance.now() - flightStartedAt) / flightMs);
}

// The notebook's middle once it lies in the middle of the table
export function getLandedPosition(tableTop: number): [number, number, number] {
  return [0, tableTop + SHELF_NOTEBOOK_THICKNESS / 2, TABLE_IN_FRONT];
}

// How much wider than the 3D notebook's shape a box on screen is, so the
// notebook can be stretched to match it exactly
export function getWidthScale(rect: DOMRect) {
  return rect.width / rect.height / (NOTEBOOK_WIDTH / NOTEBOOK_HEIGHT);
}

// How far the view's middle is moved so what the camera aims at shows up
// in the middle of this box on screen, in a picture fullWidth by fullHeight
export function getViewOffset(
  rect: DOMRect,
  fullWidth: number,
  fullHeight: number,
) {
  return {
    x: fullWidth / 2 - (rect.x + rect.width / 2),
    y: fullHeight / 2 - (rect.y + rect.height / 2),
  };
}

// Where the camera ends: straight above the landed notebook, far enough up
// that it's as tall on screen as the notebook view's cover
export function getLandedCameraPosition(
  landedAt: [number, number, number],
  fieldOfView: number,
  fullHeight: number,
  landingRect: DOMRect,
) {
  const landedTop = landedAt[1] + SHELF_NOTEBOOK_THICKNESS / 2;
  const viewHalfAngle = ((fieldOfView / 2) * Math.PI) / 180;
  const height =
    (NOTEBOOK_HEIGHT * fullHeight) /
    landingRect.height /
    2 /
    Math.tan(viewHalfAngle);
  return new Vector3(landedAt[0], landedTop + height, landedAt[2]);
}

// Moves the light from where it started to above the table. A light more
// overhead lights the table more, so it's dimmed to keep the table and the
// landed cover the same colors as the page that follows
export function moveLightTowardTable(
  light: DirectionalLight,
  startPosition: Vector3,
  eased: number,
) {
  light.position.lerpVectors(startPosition, TABLE_LIGHT, eased);
  const startLightOnTable = startPosition.clone().normalize().y;
  const lightOnTable = light.position.clone().normalize().y;
  light.intensity = (MAIN_LIGHT_STRENGTH * startLightOnTable) / lightOnTable;
}

// The camera's path while the notebook flies: where it moves, where it
// first aims, the notebook it ends up aiming at, and the screen boxes the
// view's middle moves between
export type CameraFlight = {
  cameraFrom: Vector3;
  cameraTo: Vector3;
  aimFrom: Vector3;
  notebookFrom: Vector3;
  notebookTo: Vector3;
  startRect: DOMRect;
  landingRect: DOMRect;
  fullWidth: number;
  fullHeight: number;
  viewWidth: number;
  viewHeight: number;
};

// Moves the camera above the table while it keeps its eye on the notebook.
// Its aim slides from where it first looked onto the notebook as it flies
// down, while the view's middle moves from the start box to the cover's box
export function placeFlightCamera(
  camera: PerspectiveCamera,
  flight: CameraFlight,
  eased: number,
) {
  const startOffset = getViewOffset(
    flight.startRect,
    flight.fullWidth,
    flight.fullHeight,
  );
  const landingOffset = getViewOffset(
    flight.landingRect,
    flight.fullWidth,
    flight.fullHeight,
  );
  const notebookAt = new Vector3().lerpVectors(
    flight.notebookFrom,
    flight.notebookTo,
    eased,
  );
  const aim = new Vector3().lerpVectors(flight.aimFrom, notebookAt, eased);

  // up leans away from the wall, so the camera never spins as it ends up
  // looking straight down
  camera.up.copy(CAMERA_UP);
  camera.position.lerpVectors(flight.cameraFrom, flight.cameraTo, eased);
  camera.lookAt(aim);
  camera.setViewOffset(
    flight.fullWidth,
    flight.fullHeight,
    startOffset.x + (landingOffset.x - startOffset.x) * eased,
    startOffset.y + (landingOffset.y - startOffset.y) * eased,
    flight.viewWidth,
    flight.viewHeight,
  );
}
