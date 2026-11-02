import type { Group } from "three";
import type { NotebookSummary } from "@/types/Notebook";
import { useRef } from "react";
import { Euler, Quaternion, Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { NOTEBOOK_COVER_STYLES } from "@/constants/NotebookCoverStyles";
import { NotebookModel } from "../NotebookModel/NotebookModel";
import { easeInOutQuart } from "../EasingStep";
import { SHELF_NOTEBOOK_THICKNESS } from "../Bookshelf/BookshelfLook";
import { SpineTitle } from "../Bookshelf/SpineTitle";
import { FLYING_COVER_ROUGHNESS } from "./TableFlightLook";
import { getFlightProgress } from "./TableFlightMotion";

type FlyingNotebookProps = {
  notebook: NotebookSummary;
  from: [number, number, number]; // its middle where the flight starts
  fromRotation: Quaternion; // how it's turned where the flight starts
  to: [number, number, number]; // its middle, lying on the table
  startedAt: number; // when the flight started, from performance.now()
  flightMs: number; // how long the flight takes
  // how much wider it starts and lands, to match what it takes over from
  // and the notebook view's cover exactly
  fromWidthScale: number;
  landedWidthScale: number;
};

// Lying on the table cover up, its top away from you and its spine on the
// left, the way the notebook view shows it from above
const ON_TABLE = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0));

// The notebook being opened, flying from where it starts down onto the
// table while it turns to lie flat
export function FlyingNotebook({
  notebook,
  from,
  fromRotation,
  to,
  startedAt,
  flightMs,
  fromWidthScale,
  landedWidthScale,
}: FlyingNotebookProps) {
  const { colors } = NOTEBOOK_COVER_STYLES[notebook.coverStyle];
  const groupRef = useRef<Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  const fromPosition = new Vector3(...from);
  const toPosition = new Vector3(...to);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const progress = getFlightProgress(startedAt, flightMs);
    const eased = easeInOutQuart(progress);
    group.position.lerpVectors(fromPosition, toPosition, eased);
    group.quaternion.slerpQuaternions(fromRotation, ON_TABLE, eased);
    group.scale.x =
      fromWidthScale + (landedWidthScale - fromWidthScale) * eased;

    if (progress < 1) invalidate();
  });

  return (
    <group
      ref={groupRef}
      position={from}
      quaternion={fromRotation}
      scale-x={fromWidthScale}
    >
      <NotebookModel
        colors={colors}
        thickness={SHELF_NOTEBOOK_THICKNESS}
        coverRoughness={FLYING_COVER_ROUGHNESS}
      />
      <SpineTitle title={notebook.title} spineColor={colors.spine} />
    </group>
  );
}
