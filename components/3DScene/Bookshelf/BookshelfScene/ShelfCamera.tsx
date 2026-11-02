import type { PerspectiveCamera as PerspectiveCameraType } from "three";
import type { Opening } from "./OpeningPath";
import { useLayoutEffect, useRef } from "react";
import { Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { easeInOutQuart } from "../../EasingStep";
import {
  CAMERA_VIEW_DEGREES,
  LOOK_DOWN_DEGREES,
  SHELF_DEPTH,
} from "../BookshelfLook";
import {
  getFlightProgress,
  getLandedCameraPosition,
  getViewOffset,
  placeFlightCamera,
} from "../../TableFlight/TableFlightMotion";

type ShelfCameraProps = {
  cameraDistance: number;
  pixelsPerUnit: number;
  opening: Opening | null;
  flightFrom: [number, number, number] | null; // the notebook's start
  landedAt: [number, number, number];
};

const LOOK_DOWN = (LOOK_DOWN_DEGREES * Math.PI) / 180;

// Where the camera looks before opening
const SHELF_MIDDLE = new Vector3(0, 0, 0);

// The camera, raised and tipped down at the shelf's middle. While opening
// it keeps the shelf where it was on screen, then flies down above the table
export function ShelfCamera({
  cameraDistance,
  pixelsPerUnit,
  opening,
  flightFrom,
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

  // Where it sits before opening, raised to look down at the shelf
  const cameraStart = new Vector3(
    0,
    cameraDistance * Math.tan(LOOK_DOWN),
    cameraDistance,
  );

  // It flies from where it sat, aimed at the shelf's middle with the view's
  // middle over the shelf's box, to straight above the landed notebook, as
  // big as the notebook view's cover and with the view's middle on its box
  useFrame(() => {
    const camera = cameraRef.current;
    if (!camera || opening?.flightStartedAt == null || !flightFrom) return;
    const progress = getFlightProgress(
      opening.flightStartedAt,
      opening.flightMs,
    );
    // a new notebook starts close to the camera and falls far, so the camera
    // aims right at it the whole way, starting over the closed cover, while
    // the shelf slides up behind it
    const start = opening.start;
    const eased = easeInOutQuart(progress);
    const notebookFrom = new Vector3(...flightFrom);
    const notebookTo = new Vector3(...landedAt);
    const notebookAt = new Vector3().lerpVectors(
      notebookFrom,
      notebookTo,
      eased,
    );
    placeFlightCamera(
      camera,
      {
        cameraFrom: cameraStart,
        cameraTo: getLandedCameraPosition(
          landedAt,
          fieldOfView,
          fullHeight,
          opening.landingRect,
        ),
        aimFrom: start.kind === "created" ? notebookAt : SHELF_MIDDLE,
        notebookFrom,
        notebookTo,
        startRect:
          start.kind === "created" ? start.coverRect : opening.shelfRect,
        landingRect: opening.landingRect,
        fullWidth,
        fullHeight,
        viewWidth: canvasSize.width,
        viewHeight: canvasSize.height,
      },
      eased,
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
