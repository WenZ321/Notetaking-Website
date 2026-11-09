import type { Group } from "three";
import type { ThreeEvent } from "@react-three/fiber";
import type { NotebookCoverStyle } from "@/types/Notebook";
import type { Change, Pose } from "./CarouselMotion";
import { useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
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
import { getEasedProgress, getPose, setPose } from "./CarouselMotion";
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
  const glideRef = useRef<Change<Pose> | null>(null);
  const fadeRef = useRef<Change<number> | null>(null);
  const opacityRef = useRef(0);
  const hasPlacedRef = useRef(false);
  const liftRef = useRef(0);
  const invalidate = useThree((state) => state.invalidate);

  const [isHovered, setIsHovered] = useState(false);
  useCursor(isHovered);
  const isLifted = isHovered || isFocused;

  // A new place starts a glide from wherever the notebook is now. The first
  // placement, a jump and reduced motion move it there straight away. Coming
  // into view or leaving it starts a fade, and so does first showing
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const { position, turn, isHidden } = getNotebookPlacement(offset);
    const to = { position: new Vector3(...position), turn };
    const now = performance.now();

    if (!hasPlacedRef.current || isJumping || isReducedMotion()) {
      hasPlacedRef.current = true;
      glideRef.current = null;
      setPose(group, to);
    } else {
      glideRef.current = { from: getPose(group), to, startedAt: now };
    }

    const targetOpacity = isHidden ? 0 : 1;
    if (opacityRef.current !== targetOpacity) {
      fadeRef.current = {
        from: opacityRef.current,
        to: targetOpacity,
        startedAt: now,
      };
    }
    invalidate();
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
    let isMoving = false;

    const glide = glideRef.current;
    if (glide) {
      const eased = getEasedProgress(glide);
      group.position.lerpVectors(glide.from.position, glide.to.position, eased);
      const turnChange = glide.to.turn - glide.from.turn;
      group.rotation.y = glide.from.turn + turnChange * eased;
      if (eased < 1) isMoving = true;
      else glideRef.current = null;
    }

    const fade = fadeRef.current;
    if (fade) {
      const eased = getEasedProgress(fade);
      opacityRef.current = fade.from + (fade.to - fade.from) * eased;
      setOpacity(group, opacityRef.current);
      if (eased < 1) isMoving = true;
      else fadeRef.current = null;
    }

    // eases toward the lift, a big step when far from it and a small one close by
    const targetLift = isLifted ? LIFT_HEIGHT : 0;
    const liftLeft = targetLift - liftRef.current;
    if (Math.abs(liftLeft) > 0.0005) {
      liftRef.current +=
        liftLeft * getEasingStep(secondsSinceLastFrame, LIFT_SPEED);
      isMoving = true;
    } else {
      liftRef.current = targetLift;
    }
    group.position.y = liftRef.current;

    // a fully faded notebook isn't drawn, so it can't be clicked or cast a shadow
    group.visible = !isOpened && opacityRef.current > 0;

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
      <NotebookModel
        colors={NOTEBOOK_COVER_STYLES[coverStyle].colors}
        thickness={NOTEBOOK_THICKNESS}
        coverRoughness={COVER_ROUGHNESS}
      />
    </group>
  );
}
