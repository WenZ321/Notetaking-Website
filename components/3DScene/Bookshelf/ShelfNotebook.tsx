import type { Group } from "three";
import type { ThreeEvent } from "@react-three/fiber";
import type { NotebookSummary } from "@/types/Notebook";
import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import { NOTEBOOK_COVER_STYLES } from "@/constants/NotebookCoverStyles";
import { NotebookModel } from "../NotebookModel/NotebookModel";
import {
  COVER_ROUGHNESS,
  NOTEBOOK_HEIGHT,
  NOTEBOOK_WIDTH,
} from "../NotebookModel/NotebookLook";
import {
  OPEN_SLIDE,
  OPEN_SLIDE_MS,
  PULL_OUT_LIFT,
  PULL_OUT_SLIDE,
  PULL_OUT_SPEED,
  PULL_OUT_TILT_DEGREES,
  SHELF_NOTEBOOK_GAP,
  SHELF_NOTEBOOK_THICKNESS,
} from "./BookshelfLook";
import { easeInOutQuart, getEasingStep } from "../EasingStep";
import { SpineTitle } from "./SpineTitle";

type ShelfNotebookProps = {
  notebook: NotebookSummary;
  position: [number, number, number]; // its middle, standing on the shelf
  isFocused: boolean; // its link has keyboard focus, which pulls it out
  // when it was chosen, so it slides all the way out, or null
  openingStartedAt: number | null;
  isFlying: boolean; // its flying copy has taken over, so it hides
  onOpen: () => void;
};

// Moves a value a step toward its target, landing on it once it's close
function easeToward(
  valueRef: { current: number },
  target: number,
  step: number,
): { value: number; isMoving: boolean } {
  const left = target - valueRef.current;
  if (Math.abs(left) <= 0.001) {
    valueRef.current = target;
    return { value: target, isMoving: false };
  }
  valueRef.current += left * step;
  return { value: valueRef.current, isMoving: true };
}

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
  openingStartedAt,
  isFlying,
  onOpen,
}: ShelfNotebookProps) {
  const { colors } = NOTEBOOK_COVER_STYLES[notebook.coverStyle];
  const pivotRef = useRef<Group>(null);
  const pullRef = useRef(0); // 0 standing, 1 fully pulled out
  const invalidate = useThree((state) => state.invalidate);

  const [isHovered, setIsHovered] = useState(false);
  useCursor(isHovered);
  const isOpening = openingStartedAt !== null;
  const isPulledOut = isHovered || isFocused || isOpening;

  // Pulling out, putting back and opening need a new frame drawn
  useEffect(() => {
    invalidate();
  }, [isPulledOut, isOpening, invalidate]);

  // Each frame eases toward pulled out or standing, a big step when far and
  // a small one close by, and slides it all the way out while opening
  useFrame((_, secondsSinceLastFrame) => {
    const pivot = pivotRef.current;
    if (!pivot) return;

    const pull = easeToward(
      pullRef,
      isPulledOut ? 1 : 0,
      getEasingStep(secondsSinceLastFrame, PULL_OUT_SPEED),
    );
    // the opening slide takes exactly OPEN_SLIDE_MS, so it's all the way
    // out when its flying copy takes over from it
    const slideProgress =
      openingStartedAt === null
        ? 0
        : Math.min(1, (performance.now() - openingStartedAt) / OPEN_SLIDE_MS);
    const open = easeInOutQuart(slideProgress);
    if (pull.isMoving || (isOpening && slideProgress < 1)) invalidate();

    // opening slides it further out and straightens its tip
    pivot.position.y = pull.value * PULL_OUT_LIFT;
    pivot.position.z =
      pull.value * PULL_OUT_SLIDE + open * (OPEN_SLIDE - PULL_OUT_SLIDE);
    pivot.rotation.x = pull.value * PULL_OUT_TILT * (1 - open);
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
    <group
      position={[x, y - NOTEBOOK_HEIGHT / 2, z + NOTEBOOK_WIDTH / 2]}
      visible={!isFlying}
    >
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
          <NotebookModel
            colors={colors}
            thickness={SHELF_NOTEBOOK_THICKNESS}
            coverRoughness={COVER_ROUGHNESS}
          />
          <SpineTitle title={notebook.title} spineColor={colors.spine} />
        </group>
      </group>
    </group>
  );
}
