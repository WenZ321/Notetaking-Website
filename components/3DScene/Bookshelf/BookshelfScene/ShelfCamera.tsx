import type { PerspectiveCamera as PerspectiveCameraType } from "three";
import type { Opening } from "./OpeningPath";
import { useLayoutEffect, useRef } from "react";
import { Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { NOTEBOOK_HEIGHT } from "../../NotebookModel/NotebookLook";
import { easeInOutQuart } from "../../EasingStep";
import {
  CAMERA_VIEW_DEGREES,
  LOOK_DOWN_DEGREES,
  OPEN_FLIGHT_MS,
  SHELF_DEPTH,
  SHELF_NOTEBOOK_THICKNESS,
} from "../BookshelfLook";
import { getViewOffset } from "./OpeningPath";

type ShelfCameraProps = {
  cameraDistance: number;
  pixelsPerUnit: number;
  opening: Opening | null;
  slidOutAt: [number, number, number] | null;
  landedAt: [number, number, number];
};

const LOOK_DOWN = (LOOK_DOWN_DEGREES * Math.PI) / 180;

// Where the camera looks before opening, and which way is up for it while
// it flies, leaning away from the shelf so looking straight down still has
// a clear up
const SHELF_MIDDLE = new Vector3(0, 0, 0);
const CAMERA_UP = new Vector3(0, 1, -1).normalize();

// The camera, raised and tipped down at the shelf's middle. While opening
// it keeps the shelf where it was on screen, then flies down above the table
export function ShelfCamera({
  cameraDistance,
  pixelsPerUnit,
  opening,
  slidOutAt,
  landedAt,
}: ShelfCameraProps) {
  const canvasSize = useThree((state) => state.size);
  const cameraRef = useRef<PerspectiveCameraType>(null);

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

  // The camera ends straight above the landed notebook, far enough up that
  // it's as tall on screen as the notebook view's cover. The view's middle
  // then moves onto the cover's box, so the notebook lies exactly where the
  // cover will be drawn
  const landedTop = landedAt[1] + SHELF_NOTEBOOK_THICKNESS / 2;
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
    landedAt[0],
    landedTop + landedCameraHeight,
    landedAt[2],
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

  // It only sees from just in front of the shelf to just past the wall,
  // which keeps close surfaces like a title and its spine apart. While
  // opening it sees further, since it moves out to the table
  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={fieldOfView}
      near={opening ? 0.3 : cameraDistance - 2}
      far={opening ? cameraDistance + 20 : cameraDistance + SHELF_DEPTH + 2}
      position={[0, cameraDistance * Math.tan(LOOK_DOWN), cameraDistance]}
      rotation={[-LOOK_DOWN, 0, 0]}
    />
  );
}
