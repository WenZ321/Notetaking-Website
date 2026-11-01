import type { Group } from "three";
import type { ThreeEvent } from "@react-three/fiber";
import type { NotebookSummary } from "@/types/Notebook";
import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import { NOTEBOOK_COVER_STYLES } from "@/constants/NotebookCoverStyles";
import { NotebookModel } from "../NotebookModel/NotebookModel";
import {
  NOTEBOOK_HEIGHT,
  NOTEBOOK_WIDTH,
} from "../NotebookModel/NotebookLook";
import {
  PULL_OUT_LIFT,
  PULL_OUT_SLIDE,
  PULL_OUT_SPEED,
  PULL_OUT_TILT_DEGREES,
  SHELF_NOTEBOOK_GAP,
  SHELF_NOTEBOOK_THICKNESS,
} from "./BookshelfLook";
import { SpineTitle } from "./SpineTitle";

type ShelfNotebookProps = {
  notebook: NotebookSummary;
  position: [number, number, number]; // its middle, standing on the shelf
  isFocused: boolean; // its link has keyboard focus, which pulls it out
  onOpen: () => void;
};

// A spine-out notebook turns a quarter so its spine faces you
const SPINE_OUT_TURN = Math.PI / 2;
const PULL_OUT_TILT = (PULL_OUT_TILT_DEGREES * Math.PI) / 180;

// A saved notebook standing spine-out on the bookshelf, thicker than the
// carousel's, with its title along the spine. Hovering it or focusing its
// link pulls it out, and clicking it opens it
export function ShelfNotebook({
  notebook,
  position,
  isFocused,
  onOpen,
}: ShelfNotebookProps) {
  const { colors } = NOTEBOOK_COVER_STYLES[notebook.coverStyle];
  const pivotRef = useRef<Group>(null);
  const pullRef = useRef(0); // 0 standing, 1 fully pulled out
  const invalidate = useThree((state) => state.invalidate);

  const [isHovered, setIsHovered] = useState(false);
  useCursor(isHovered);
  const isPulledOut = isHovered || isFocused;

  // Pulling out and putting back need a new frame drawn
  useEffect(() => {
    invalidate();
  }, [isPulledOut, invalidate]);

  // Each frame eases toward pulled out or standing, a big step when far
  // from it and a small one close by, until it's there
  useFrame((_, secondsSinceLastFrame) => {
    const pivot = pivotRef.current;
    if (!pivot) return;

    const target = isPulledOut ? 1 : 0;
    const left = target - pullRef.current;
    if (Math.abs(left) > 0.001) {
      pullRef.current +=
        left * Math.min(1, secondsSinceLastFrame * PULL_OUT_SPEED);
      invalidate();
    } else {
      pullRef.current = target;
    }
    pivot.position.y = pullRef.current * PULL_OUT_LIFT;
    pivot.position.z = pullRef.current * PULL_OUT_SLIDE;
    pivot.rotation.x = pullRef.current * PULL_OUT_TILT;
  });

  // Only the mouse pulls it out, since a tap counts as hovering and would
  // leave it out
  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (event.pointerType === "mouse") setIsHovered(true);
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onOpen();
  };

  // It turns on its bottom front edge, so the outer group sits there and
  // the notebook hangs from it, its middle back up and in
  const [x, y, z] = position;
  return (
    <group position={[x, y - NOTEBOOK_HEIGHT / 2, z + NOTEBOOK_WIDTH / 2]}>
      {/* an unseen box over the notebook's spot that takes the hover and
          click. It's one piece, so moving across the notebook's parts doesn't
          count as leaving it, and it stays put while the notebook pulls out,
          so the notebook can't slide out from under the cursor */}
      <mesh
        position={[0, NOTEBOOK_HEIGHT / 2, -NOTEBOOK_WIDTH / 2]}
        onPointerOver={handlePointerOver}
        onPointerOut={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <boxGeometry
          args={[
            SHELF_NOTEBOOK_THICKNESS + SHELF_NOTEBOOK_GAP,
            NOTEBOOK_HEIGHT,
            NOTEBOOK_WIDTH,
          ]}
        />
        <meshBasicMaterial visible={false} />
      </mesh>

      <group ref={pivotRef}>
        <group
          position={[0, NOTEBOOK_HEIGHT / 2, -NOTEBOOK_WIDTH / 2]}
          rotation={[0, SPINE_OUT_TURN, 0]}
        >
          <NotebookModel colors={colors} thickness={SHELF_NOTEBOOK_THICKNESS} />
          <SpineTitle title={notebook.title} spineColor={colors.spine} />
        </group>
      </group>
    </group>
  );
}
