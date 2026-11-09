import type { Group } from "three";
import type { ThreeEvent } from "@react-three/fiber";
import type { NotebookCoverStyle } from "@/types/Notebook";
import type { Change, Pose } from "./CarouselMotion";
import { useEffect, useRef, useState } from "react";
import { MathUtils, Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import { NOTEBOOK_COVER_STYLES } from "@/constants/NotebookCoverStyles";
import { NotebookModel } from "../NotebookModel/NotebookModel";
import {
  COVER_ROUGHNESS,
  LIFT_HEIGHT,
  LIFT_SPEED,
  NOTEBOOK_THICKNESS,
} from "../NotebookModel/NotebookLook";
import { getEasingStep } from "../EasingStep";
import { setOpacity } from "../GroupOpacity";
import {
  getEasedProgress,
  getPose,
  setPose,
  startChange,
} from "./CarouselMotion";
import { getNotebookPlacement } from "./TemplateCarouselPlacement";
import { isReducedMotion } from "@/components/ReducedMotion/ReducedMotion";

type CarouselNotebookProps = {
  coverStyle: NotebookCoverStyle;
  offset: number;
  // on while hidden notebooks switch sides, so they move there instantly
  isJumping: boolean;
  isFocused: boolean; // its button has keyboard focus, which lifts it
  isOpened: boolean; // its popup is showing, so it hides to not show twice
  onOpen: () => void;
};

// A template's notebook in the 3D carousel. It glides to a new place when
// its offset changes, and lifts when it's hovered or its button is focused.
// It fades in when it first shows and when it comes into view, and fades out
// as it leaves, the same way the CSS covers did
export function CarouselNotebook({
  coverStyle,
  offset,
  isJumping,
  isFocused,
  isOpened,
  onOpen,
}: CarouselNotebookProps) {
  const groupRef = useRef<Group>(null);
  const hasPlacedRef = useRef(false);
  const glideRef = useRef<Change<Pose> | null>(null);
  const fadeRef = useRef<Change<number> | null>(null);
  const opacityRef = useRef(0);
  const liftRef = useRef(0);
  // with reduced motion, where it goes once it has faded out
  const nextSpotRef = useRef<Pose | null>(null);
  const invalidate = useThree((state) => state.invalidate);

  const [isHovered, setIsHovered] = useState(false);
  useCursor(isHovered);
  const isLifted = isHovered || isFocused;

  // Sets off the move to a new place. The first placement and a jump move
  // it there straight away, otherwise it glides, and it fades as it comes
  // into view or leaves it
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const { position, turn, isHidden } = getNotebookPlacement(offset);
    const to = { position: new Vector3(...position), turn };
    const isPlacedAtOnce = !hasPlacedRef.current || isJumping;
    // the lift changes its height, so only where it stands counts
    const isMoving =
      group.position.x !== to.position.x || group.position.z !== to.position.z;

    hasPlacedRef.current = true;
    glideRef.current = null;
    nextSpotRef.current = null;
    invalidate();

    if (isPlacedAtOnce) {
      setPose(group, to);
    } else if (!isReducedMotion()) {
      glideRef.current = startChange(getPose(group), to);
    } else if (!isHidden && isMoving) {
      // With reduced motion it fades out where it stands, then moves and fades
      // in with the rest. One already faded out still waits, so none fades in
      // before the others have faded out
      nextSpotRef.current = to;
      fadeRef.current = startChange(opacityRef.current, 0);
      return;
    }
    // Otherwise, with reduced motion, it stays where it stands. One leaving
    // fades out there and the next jump moves it

    const targetOpacity = isHidden ? 0 : 1;
    if (opacityRef.current !== targetOpacity) {
      fadeRef.current = startChange(opacityRef.current, targetOpacity);
    }
  }, [offset, isJumping, invalidate]);

  // Lifting, landing, opening and closing all need a new frame drawn
  useEffect(() => {
    invalidate();
  }, [isLifted, isOpened, invalidate]);

  // Each frame moves the notebook along its glide, fade and lift, and asks
  // for another frame until they're all done
  useFrame((_, secondsSinceLastFrame) => {
    const group = groupRef.current;
    if (!group) return;
    let isAnimating = false;

    const glide = glideRef.current;
    if (glide) {
      const eased = getEasedProgress(glide);
      group.position.lerpVectors(glide.from.position, glide.to.position, eased);
      group.rotation.y = MathUtils.lerp(glide.from.turn, glide.to.turn, eased);
      if (eased < 1) isAnimating = true;
      else glideRef.current = null;
    }

    const fade = fadeRef.current;
    if (fade) {
      const eased = getEasedProgress(fade);
      opacityRef.current = MathUtils.lerp(fade.from, fade.to, eased);
      setOpacity(group, opacityRef.current);
      if (eased < 1) isAnimating = true;
      else fadeRef.current = null;
    }

    // faded out at its old spot, so it moves and fades back in at the new one
    const nextSpot = nextSpotRef.current;
    if (nextSpot && !fadeRef.current) {
      nextSpotRef.current = null;
      setPose(group, nextSpot);
      fadeRef.current = startChange(0, 1);
      isAnimating = true;
    }

    // eases toward the lift, a big step when far from it and a small one close by
    const targetLift = isLifted ? LIFT_HEIGHT : 0;
    const liftLeft = targetLift - liftRef.current;
    if (Math.abs(liftLeft) > 0.0005) {
      liftRef.current +=
        liftLeft * getEasingStep(secondsSinceLastFrame, LIFT_SPEED);
      isAnimating = true;
    } else {
      liftRef.current = targetLift;
    }
    group.position.y = liftRef.current;

    // a fully faded notebook isn't drawn, so it can't be clicked or cast a shadow
    group.visible = !isOpened && opacityRef.current > 0;

    if (isAnimating) invalidate();
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
      <NotebookModel
        colors={NOTEBOOK_COVER_STYLES[coverStyle].colors}
        thickness={NOTEBOOK_THICKNESS}
        coverRoughness={COVER_ROUGHNESS}
      />
    </group>
  );
}
