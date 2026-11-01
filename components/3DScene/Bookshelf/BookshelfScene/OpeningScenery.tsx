import type { Material } from "three";
import type { NotebookSummary } from "@/types/Notebook";
import type { ShelfLayout } from "../ShelfLayout";
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { easeInOutQuart } from "../../EasingStep";
import {
  SHELF_DEPTH,
  SHELF_ROUGHNESS,
  SURROUND_FADE_MS,
  TABLE_COLOR,
  TABLE_IN_FRONT,
  TABLE_SIZE,
  WALL_COLOR,
} from "../BookshelfLook";
import { FlyingNotebook } from "./FlyingNotebook";
import { getTableTop } from "./OpeningPath";

type OpeningSceneryProps = {
  notebook: NotebookSummary;
  layout: ShelfLayout;
  flightStartedAt: number | null;
  slidOutAt: [number, number, number];
  landedAt: [number, number, number];
};

// What only exists while a notebook opens: the rest of the wall and the
// table, which fade in over the page while the notebook flies down onto
// the table
export function OpeningScenery({
  notebook,
  layout,
  flightStartedAt,
  slidOutAt,
  landedAt,
}: OpeningSceneryProps) {
  const { width, height } = layout;
  const invalidate = useThree((state) => state.invalidate);
  const surroundRef = useRef<Material>(null);
  const tableRef = useRef<Material>(null);
  const tableTop = getTableTop(height);

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
      {/* the rest of the wall, just behind the shelf's own spot */}
      <mesh position={[0, 0, -SHELF_DEPTH - 0.04]} receiveShadow>
        <planeGeometry args={[width + 40, height + 40]} />
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
          roughness={SHELF_ROUGHNESS}
          transparent
          opacity={0}
        />
      </mesh>

      {flightStartedAt !== null && (
        <FlyingNotebook
          notebook={notebook}
          from={slidOutAt}
          to={landedAt}
          startedAt={flightStartedAt}
        />
      )}
    </>
  );
}
