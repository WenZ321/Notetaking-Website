import type { CameraFlight } from "@/components/3DScene/TableFlight/TableFlightMotion";
import { afterEach, describe, expect, test, vi } from "vitest";
import { DirectionalLight, PerspectiveCamera, Vector3 } from "three";
import {
  getFlightProgress,
  getLandedCameraPosition,
  getLandedPosition,
  getViewOffset,
  getWidthScale,
  moveLightTowardTable,
  placeFlightCamera,
} from "@/components/3DScene/TableFlight/TableFlightMotion";
import {
  MAIN_LIGHT_STRENGTH,
  NOTEBOOK_HEIGHT,
  NOTEBOOK_WIDTH,
} from "@/components/3DScene/NotebookModel/NotebookLook";
import { SHELF_NOTEBOOK_THICKNESS } from "@/components/3DScene/Bookshelf/BookshelfLook";
import {
  TABLE_IN_FRONT,
  TABLE_LIGHT_POSITION,
} from "@/components/3DScene/TableFlight/TableFlightLook";

// A box on screen, in the shape the browser gives one
function makeRect(x: number, y: number, width: number, height: number) {
  return { x, y, width, height } as DOMRect;
}

const FULL_WIDTH = 1200;
const FULL_HEIGHT = 800;
const FIELD_OF_VIEW = 30;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getFlightProgress", () => {
  test("goes from 0 to 1 over the flight, and stays at 1 after", () => {
    const now = vi.spyOn(performance, "now");

    now.mockReturnValue(1000);
    expect(getFlightProgress(1000, 400)).toBe(0);
    now.mockReturnValue(1200);
    expect(getFlightProgress(1000, 400)).toBe(0.5);
    now.mockReturnValue(5000);
    expect(getFlightProgress(1000, 400)).toBe(1);
  });
});

describe("getLandedPosition", () => {
  test("the notebook lies flat on the table, in front of the shelf", () => {
    const [x, y, z] = getLandedPosition(-3);

    expect(x).toBe(0);
    expect(y - SHELF_NOTEBOOK_THICKNESS / 2).toBe(-3);
    expect(z).toBe(TABLE_IN_FRONT);
  });
});

describe("getWidthScale", () => {
  test("is 1 for a box the notebook's shape, and grows with a wider box", () => {
    expect(getWidthScale(makeRect(0, 0, NOTEBOOK_WIDTH * 300, 300))).toBeCloseTo(1);
    expect(
      getWidthScale(makeRect(0, 0, NOTEBOOK_WIDTH * 600, 300)),
    ).toBeCloseTo(2);
  });
});

describe("getViewOffset", () => {
  test("a box in the middle of the picture needs no move", () => {
    const middle = makeRect(500, 300, 200, 200);

    expect(getViewOffset(middle, FULL_WIDTH, FULL_HEIGHT)).toEqual({ x: 0, y: 0 });
  });

  test("a box right of and below the middle moves the view left and up", () => {
    const offset = getViewOffset(
      makeRect(600, 400, 200, 200),
      FULL_WIDTH,
      FULL_HEIGHT,
    );

    expect(offset).toEqual({ x: -100, y: -100 });
  });
});

describe("getLandedCameraPosition", () => {
  test("from there the landed notebook is as tall on screen as the notebook view's cover", () => {
    const landedAt: [number, number, number] = [0, -2, TABLE_IN_FRONT];
    const landingRect = makeRect(400, 100, 300, 420);
    const position = getLandedCameraPosition(
      landedAt,
      FIELD_OF_VIEW,
      FULL_HEIGHT,
      landingRect,
    );

    // straight above the notebook, looking down at its top
    expect(position.x).toBe(landedAt[0]);
    expect(position.z).toBe(landedAt[2]);

    const camera = new PerspectiveCamera(FIELD_OF_VIEW, FULL_WIDTH / FULL_HEIGHT);
    camera.position.copy(position);
    camera.up.set(0, 0, -1);
    camera.lookAt(...landedAt);
    camera.updateMatrixWorld();

    // the notebook lies flat, so its height runs along the table
    const top = landedAt[1] + SHELF_NOTEBOOK_THICKNESS / 2;
    const far = new Vector3(0, top, landedAt[2] - NOTEBOOK_HEIGHT / 2).project(camera);
    const near = new Vector3(0, top, landedAt[2] + NOTEBOOK_HEIGHT / 2).project(camera);
    const heightOnScreen = ((far.y - near.y) / 2) * FULL_HEIGHT;
    expect(heightOnScreen).toBeCloseTo(landingRect.height, 3);
  });
});

describe("moveLightTowardTable", () => {
  const start = new Vector3(3, 3, 2);

  test("starts where it was at full strength and ends above the table", () => {
    const light = new DirectionalLight();

    moveLightTowardTable(light, start, 0);
    expect(light.position.toArray()).toEqual(start.toArray());
    expect(light.intensity).toBeCloseTo(MAIN_LIGHT_STRENGTH);

    moveLightTowardTable(light, start, 1);
    expect(light.position.toArray()).toEqual(TABLE_LIGHT_POSITION);
  });

  test("keeps how much light reaches the table the same all the way", () => {
    const light = new DirectionalLight();
    const startOnTable = MAIN_LIGHT_STRENGTH * start.clone().normalize().y;

    [0.25, 0.5, 1].forEach((eased) => {
      moveLightTowardTable(light, start, eased);
      const onTable = light.intensity * light.position.clone().normalize().y;
      expect(onTable).toBeCloseTo(startOnTable);
    });
  });
});

describe("placeFlightCamera", () => {
  const flight: CameraFlight = {
    cameraFrom: new Vector3(0, 1, 10),
    cameraTo: new Vector3(0, 8, 4),
    aimFrom: new Vector3(0, 0, 0),
    notebookFrom: new Vector3(0, 0, 1),
    notebookTo: new Vector3(0, -2, 4),
    startRect: makeRect(600, 400, 200, 200),
    landingRect: makeRect(500, 300, 200, 200),
    fullWidth: FULL_WIDTH,
    fullHeight: FULL_HEIGHT,
    viewWidth: FULL_WIDTH,
    viewHeight: FULL_HEIGHT,
  };

  test("starts at the camera's start, aimed where it first looked, centered on the start box", () => {
    const camera = new PerspectiveCamera();
    placeFlightCamera(camera, flight, 0);

    expect(camera.position.toArray()).toEqual(flight.cameraFrom.toArray());
    const toAim = flight.aimFrom.clone().sub(flight.cameraFrom).normalize();
    expect(camera.getWorldDirection(new Vector3()).dot(toAim)).toBeCloseTo(1);
    expect(camera.view?.offsetX).toBe(-100);
    expect(camera.view?.offsetY).toBe(-100);
  });

  test("ends at the camera's end, aimed at the landed notebook, centered on the cover's box", () => {
    const camera = new PerspectiveCamera();
    placeFlightCamera(camera, flight, 1);

    expect(camera.position.toArray()).toEqual(flight.cameraTo.toArray());
    const toNotebook = flight.notebookTo.clone().sub(flight.cameraTo).normalize();
    expect(camera.getWorldDirection(new Vector3()).dot(toNotebook)).toBeCloseTo(1);
    expect(camera.view?.offsetX).toBe(0);
    expect(camera.view?.offsetY).toBe(0);
  });
});
