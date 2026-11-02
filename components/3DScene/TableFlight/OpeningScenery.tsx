import type { Material, Quaternion } from "three";
import type { NotebookSummary } from "@/types/Notebook";
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { easeInOutQuart } from "../EasingStep";
import {
  SURROUND_FADE_MS,
  TABLE_COLOR,
  TABLE_IN_FRONT,
  TABLE_ROUGHNESS,
  TABLE_SIZE,
  WALL_COLOR,
} from "./TableFlightLook";
import { FlyingNotebook } from "./FlyingNotebook";

type OpeningSceneryProps = {
  notebook: NotebookSummary;
  tableTop: number;
  wallZ: number; // how far back the wall is
  flightStartedAt: number | null;
  startAt: [number, number, number];
  startRotation: Quaternion;
  landedAt: [number, number, number];
  landedWidthScale: number;
};

// Big enough that the wall reaches well past the edges of the view
const WALL_SIZE = 100;

// What only exists while a notebook opens: the wall and the table, which
// fade in over the page while the notebook flies down onto the table
export function OpeningScenery({
  notebook,
  tableTop,
  wallZ,
  flightStartedAt,
  startAt,
  startRotation,
  landedAt,
  landedWidthScale,
}: OpeningSceneryProps) {
  const invalidate = useThree((state) => state.invalidate);
  const surroundRef = useRef<Material>(null);
  const tableRef = useRef<Material>(null);

  useFrame(() => {
    if (flightStartedAt === null) return;
    const progress = Math.min(
      1,
      (performance.now() - flightStartedAt) / SURROUND_FADE_MS,
    );
    const opacity = easeInOutQuart(progress);
    if (surroundRef.current) surroundRef.current.opacity = opacity;
    if (tableRef.current) tableRef.current.opacity = opacity;
    if (progress < 1) invalidate();
  });

  return (
    <>
      <mesh position={[0, 0, wallZ]} receiveShadow>
        <planeGeometry args={[WALL_SIZE, WALL_SIZE]} />
        <meshStandardMaterial
          ref={surroundRef}
          color={WALL_COLOR}
          roughness={1}
          transparent
          opacity={0}
        />
      </mesh>

      <mesh
        position={[0, tableTop - TABLE_SIZE[1] / 2, TABLE_IN_FRONT]}
        receiveShadow
      >
        <boxGeometry args={TABLE_SIZE} />
        <meshStandardMaterial
          ref={tableRef}
          color={TABLE_COLOR}
          roughness={TABLE_ROUGHNESS}
          transparent
          opacity={0}
        />
      </mesh>

      {flightStartedAt !== null && (
        <FlyingNotebook
          notebook={notebook}
          from={startAt}
          fromRotation={startRotation}
          to={landedAt}
          startedAt={flightStartedAt}
          landedWidthScale={landedWidthScale}
        />
      )}
    </>
  );
}
