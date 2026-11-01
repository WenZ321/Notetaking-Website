import type { Group } from "three";
import type { NotebookSummary } from "@/types/Notebook";
import { useRef } from "react";
import { Euler, Quaternion, Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { NOTEBOOK_COVER_STYLES } from "@/constants/NotebookCoverStyles";
import { NotebookModel } from "../../NotebookModel/NotebookModel";
import { easeInOutQuart } from "../../EasingStep";
import { OPEN_FLIGHT_MS, SHELF_NOTEBOOK_THICKNESS } from "../BookshelfLook";
import { SpineTitle } from "../SpineTitle";

type FlyingNotebookProps = {
  notebook: NotebookSummary;
  from: [number, number, number]; // its middle, slid out of the shelf
  to: [number, number, number]; // its middle, lying on the table
  startedAt: number; // when the flight started, from performance.now()
};

// Spine-out on the shelf, its spine facing you
const ON_SHELF = new Quaternion().setFromEuler(new Euler(0, Math.PI / 2, 0));

// Lying on the table cover up, its top away from you and its spine on the
// left, the way the notebook view shows it from above
const ON_TABLE = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0));

// The notebook that was chosen, flying from where it slid out of the shelf
// down onto the table while it turns to lie flat. It takes over from the
// shelf's copy, which hides
export function FlyingNotebook({
  notebook,
  from,
  to,
  startedAt,
}: FlyingNotebookProps) {
  const { colors } = NOTEBOOK_COVER_STYLES[notebook.coverStyle];
  const groupRef = useRef<Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  const fromPosition = new Vector3(...from);
  const toPosition = new Vector3(...to);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const progress = Math.min(1, (performance.now() - startedAt) / OPEN_FLIGHT_MS);
    const eased = easeInOutQuart(progress);
    group.position.lerpVectors(fromPosition, toPosition, eased);
    group.quaternion.slerpQuaternions(ON_SHELF, ON_TABLE, eased);
    if (progress < 1) invalidate();
  });

  return (
    <group ref={groupRef} position={from} quaternion={ON_SHELF}>
      <NotebookModel colors={colors} thickness={SHELF_NOTEBOOK_THICKNESS} />
      <SpineTitle title={notebook.title} spineColor={colors.spine} />
    </group>
  );
}
