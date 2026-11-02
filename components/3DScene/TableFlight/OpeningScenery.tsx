import type { Material } from "three";
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { easeInOutQuart } from "../EasingStep";
import {
  SURROUND_FADE_MS,
  TABLE_BACK,
  TABLE_COLOR,
  TABLE_ROUGHNESS,
  TABLE_SIZE,
  WALL_COLOR,
} from "./TableFlightLook";

type OpeningSceneryProps = {
  tableTop: number;
  wallZ: number; // how far back the wall is
  flightStartedAt: number | null;
};

// Big enough that the wall reaches well past the edges of the view
const WALL_SIZE = 100;

// What only exists while a notebook opens: the wall and the table, which
// fade in over the page while the notebook flies down onto the table
export function OpeningScenery({
  tableTop,
  wallZ,
  flightStartedAt,
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
        position={[
          0,
          tableTop - TABLE_SIZE[1] / 2,
          TABLE_BACK + TABLE_SIZE[2] / 2,
        ]}
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
    </>
  );
}
