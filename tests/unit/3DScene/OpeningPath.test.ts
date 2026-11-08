import type { Opening } from "@/components/3DScene/Bookshelf/BookshelfScene/OpeningPath";
import { describe, expect, test } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import {
  getFlightStart,
  getSlidOutPosition,
  getTableTop,
} from "@/components/3DScene/Bookshelf/BookshelfScene/OpeningPath";
import {
  getShelfLayout,
  getShelfNotebookPosition,
} from "@/components/3DScene/Bookshelf/ShelfLayout";
import {
  CAMERA_VIEW_DEGREES,
  LOOK_DOWN_DEGREES,
  OPEN_SLIDE,
  PULL_OUT_LIFT,
  SHELF_NOTEBOOK_THICKNESS,
  TABLE_BELOW_SHELF,
} from "@/components/3DScene/Bookshelf/BookshelfLook";
import {
  NOTEBOOK_HEIGHT,
  NOTEBOOK_WIDTH,
} from "@/components/3DScene/NotebookModel/NotebookLook";

// A box on screen, in the shape the browser gives one
function makeRect(x: number, y: number, width: number, height: number) {
  return { x, y, width, height } as DOMRect;
}

// The shelf's canvas, the whole window here, and the camera looking at it
const SHELF_RECT = makeRect(0, 0, 1200, 800);
const CAMERA_DISTANCE = 20;
const VIEW_HALF_ANGLE = ((CAMERA_VIEW_DEGREES / 2) * Math.PI) / 180;
const PIXELS_PER_UNIT =
  SHELF_RECT.height / (2 * CAMERA_DISTANCE * Math.tan(VIEW_HALF_ANGLE));

// The camera the shelf scene draws with: tipped down, aimed at the shelf's middle
function makeShelfCamera() {
  const lookDown = (LOOK_DOWN_DEGREES * Math.PI) / 180;
  const camera = new PerspectiveCamera(
    CAMERA_VIEW_DEGREES,
    SHELF_RECT.width / SHELF_RECT.height,
  );
  camera.position.set(0, CAMERA_DISTANCE * Math.tan(lookDown), CAMERA_DISTANCE);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  return camera;
}

// Where a point in the scene shows up on screen
function toScreen(point: Vector3, camera: PerspectiveCamera) {
  const projected = point.clone().project(camera);
  return {
    x: SHELF_RECT.x + ((projected.x + 1) / 2) * SHELF_RECT.width,
    y: SHELF_RECT.y + ((1 - projected.y) / 2) * SHELF_RECT.height,
  };
}

function makeCreatedOpening(coverRect: DOMRect) {
  return {
    start: { kind: "created", coverRect },
    shelfRect: SHELF_RECT,
  } as Opening;
}

describe("getSlidOutPosition", () => {
  test("the notebook lifts a little and comes straight out toward you", () => {
    const layout = getShelfLayout(6.5, 10);
    const [x, y, z] = getShelfNotebookPosition(3, layout);

    expect(getSlidOutPosition(3, layout)).toEqual([
      x,
      y + PULL_OUT_LIFT,
      z + OPEN_SLIDE,
    ]);
  });
});

describe("getTableTop", () => {
  test("the table sits a fixed distance under the shelf's bottom", () => {
    expect(getTableTop(4)).toBe(-2 - TABLE_BELOW_SHELF);
  });
});

describe("getFlightStart", () => {
  test("a shelf notebook starts where it slid out to, at its usual width", () => {
    const opening = { start: { kind: "shelf" } } as Opening;
    const start = getFlightStart(
      opening,
      [1, 2, 3],
      CAMERA_DISTANCE,
      PIXELS_PER_UNIT,
    );

    expect(start?.position).toEqual([1, 2, 3]);
    expect(start?.widthScale).toBe(1);
  });

  test("a shelf notebook that hasn't slid out yet has no start", () => {
    const opening = { start: { kind: "shelf" } } as Opening;

    expect(
      getFlightStart(opening, null, CAMERA_DISTANCE, PIXELS_PER_UNIT),
    ).toBeNull();
  });

  test("a new notebook shows up exactly over the popup's closed cover", () => {
    const coverRect = makeRect(700, 150, 300, 400);
    const start = getFlightStart(
      makeCreatedOpening(coverRect),
      null,
      CAMERA_DISTANCE,
      PIXELS_PER_UNIT,
    )!;
    const camera = makeShelfCamera();

    // the cover's front faces the camera, half a notebook closer than its middle
    const forward = camera.getWorldDirection(new Vector3());
    const front = new Vector3(...start.position).addScaledVector(
      forward,
      -SHELF_NOTEBOOK_THICKNESS / 2,
    );
    const middle = toScreen(front, camera);
    expect(middle.x).toBeCloseTo(coverRect.x + coverRect.width / 2, 1);
    expect(middle.y).toBeCloseTo(coverRect.y + coverRect.height / 2, 1);

    // and it's as tall on screen as the cover
    const up = camera.up.clone().applyQuaternion(camera.quaternion);
    const top = toScreen(
      front.clone().addScaledVector(up, NOTEBOOK_HEIGHT / 2),
      camera,
    );
    const bottom = toScreen(
      front.clone().addScaledVector(up, -NOTEBOOK_HEIGHT / 2),
      camera,
    );
    expect(bottom.y - top.y).toBeCloseTo(coverRect.height, 0);
  });

  test("a new notebook is stretched to the cover's shape", () => {
    const coverRect = makeRect(0, 0, 2 * NOTEBOOK_WIDTH * 100, 100);
    const start = getFlightStart(
      makeCreatedOpening(coverRect),
      null,
      CAMERA_DISTANCE,
      PIXELS_PER_UNIT,
    );

    expect(start?.widthScale).toBeCloseTo(2);
  });
});
