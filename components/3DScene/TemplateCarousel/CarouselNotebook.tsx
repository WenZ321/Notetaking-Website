import type { Group } from "three";
import type { ThreeEvent } from "@react-three/fiber";
import type { NotebookCoverStyle } from "@/types/Notebook";
import { useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import { NOTEBOOK_COVER_STYLES } from "@/constants/NotebookCoverStyles";
import { COVER_MOVE_DURATION_MS } from "@/components/UserNotebooksPage/TemplateCarouselLayout";
import { NotebookModel } from "../NotebookModel/NotebookModel";
import { LIFT_HEIGHT, LIFT_SPEED } from "../NotebookModel/NotebookLook";
import { getNotebookPlacement } from "./TemplateCarouselPlacement";

type CarouselNotebookProps = {
  coverStyle: NotebookCoverStyle;
  offset: number;
  // on while hidden notebooks switch sides, so they move there instantly
  isJumping: boolean;
  isFocused: boolean; // its button has keyboard focus, which lifts it
  isOpened: boolean; // its popup is showing, so it hides to not show twice
  onOpen: () => void;
};

// Where a notebook is and how far it's turned
type Pose = {
  position: Vector3;
  turn: number;
};

// One glide, from where the notebook was to its new place
type Glide = {
  from: Pose;
  to: Pose;
  startedAt: number;
};

// Starts slow, speeds up through the middle and settles gently into place,
// the same curve as the CSS easing cubic-bezier(0.77, 0, 0.175, 1)
function easeInOutQuart(progress: number): number {
  return progress < 0.5
    ? 8 * progress ** 4
    : 1 - (-2 * progress + 2) ** 4 / 2;
}

function getPose(group: Group): Pose {
  return { position: group.position.clone(), turn: group.rotation.y };
}

function setPose(group: Group, pose: Pose) {
  group.position.copy(pose.position);
  group.rotation.y = pose.turn;
}

// A template's notebook in the 3D carousel. It glides to a new place when
// its offset changes, and lifts when it's hovered or its button is focused.
// Hidden notebooks stay drawn while they glide out, fading into the fog,
// then disappear
export function CarouselNotebook({
  coverStyle,
  offset,
  isJumping,
  isFocused,
  isOpened,
  onOpen,
}: CarouselNotebookProps) {
  const groupRef = useRef<Group>(null);
  const glideRef = useRef<Glide | null>(null);
  const isHiddenRef = useRef(false);
  const hasPlacedRef = useRef(false);
  const liftRef = useRef(0);
  const invalidate = useThree((state) => state.invalidate);

  const [isHovered, setIsHovered] = useState(false);
  useCursor(isHovered);
  const isLifted = isHovered || isFocused;

  // A new place starts a glide from wherever the notebook is now. The first
  // placement and a jump move it there straight away
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const { position, turn, isHidden } = getNotebookPlacement(offset);
    const to = { position: new Vector3(...position), turn };
    isHiddenRef.current = isHidden;

    if (!hasPlacedRef.current || isJumping) {
      hasPlacedRef.current = true;
      glideRef.current = null;
      setPose(group, to);
    } else {
      glideRef.current = {
        from: getPose(group),
        to,
        startedAt: performance.now(),
      };
    }
    invalidate();
  }, [offset, isJumping, invalidate]);

  // Lifting, landing, opening and closing all need a new frame drawn
  useEffect(() => {
    invalidate();
  }, [isLifted, isOpened, invalidate]);

  // Each frame moves the notebook along its glide and toward its lift, and
  // asks for another frame until both are done
  useFrame((_, secondsSinceLastFrame) => {
    const group = groupRef.current;
    if (!group) return;
    let isMoving = false;

    const glide = glideRef.current;
    if (glide) {
      const progress = Math.min(
        1,
        (performance.now() - glide.startedAt) / COVER_MOVE_DURATION_MS,
      );
      const eased = easeInOutQuart(progress);
      group.position.lerpVectors(glide.from.position, glide.to.position, eased);
      const turnChange = glide.to.turn - glide.from.turn;
      group.rotation.y = glide.from.turn + turnChange * eased;

      if (progress < 1) isMoving = true;
      else glideRef.current = null;
    }

    // eases toward the lift, a big step when far from it and a small one close by
    const targetLift = isLifted ? LIFT_HEIGHT : 0;
    const liftLeft = targetLift - liftRef.current;
    if (Math.abs(liftLeft) > 0.0005) {
      liftRef.current +=
        liftLeft * Math.min(1, secondsSinceLastFrame * LIFT_SPEED);
      isMoving = true;
    } else {
      liftRef.current = targetLift;
    }
    group.position.y = liftRef.current;

    // a notebook gliding out stays drawn until it's out of sight
    const isOutOfSight = isHiddenRef.current && !glideRef.current;
    group.visible = !isOpened && !isOutOfSight;

    if (isMoving) invalidate();
  });

  // Only the mouse lifts it, since a tap counts as hovering and would leave it lifted
  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (event.pointerType === "mouse") setIsHovered(true);
  };

  // A hidden notebook can still be hit, so only drawn ones open
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (groupRef.current?.visible) onOpen();
  };

  return (
    <group
      ref={groupRef}
      name={coverStyle}
      onPointerOver={handlePointerOver}
      onPointerOut={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <NotebookModel colors={NOTEBOOK_COVER_STYLES[coverStyle].colors} />
    </group>
  );
}
