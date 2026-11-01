"use client";

import type { RefObject } from "react";
import type { NotebookCoverStyle } from "@/types/Notebook";
import type { ReadCoverScreenRect } from "./CoverScreenRect";
import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import {
  AMBIENT_LIGHT_STRENGTH,
  MAIN_LIGHT_POSITION,
  MAIN_LIGHT_STRENGTH,
  NOTEBOOK_HEIGHT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
} from "../NotebookModel/NotebookLook";
import { CarouselNotebook } from "./CarouselNotebook";
import { CoverScreenRect } from "./CoverScreenRect";
import "./TemplateCarouselScene.css";

// One template in the carousel and its place from the center of the middle
export type CarouselCover = {
  coverStyle: NotebookCoverStyle;
  offset: number;
};

type TemplateCarouselSceneProps = {
  covers: CarouselCover[];
  // on while hidden notebooks switch sides, so they move there instantly
  isJumping: boolean;
  focusedCover: NotebookCoverStyle | null; // its button has keyboard focus
  openedCover: NotebookCoverStyle | null; // its new notebook popup is showing
  readRectRef: RefObject<ReadCoverScreenRect | null>;
  onOpenCover: (coverStyle: NotebookCoverStyle) => void;
};

// The canvas is this many notebooks tall, a little taller than one so the
// shadows fit. The CSS reads it to size the canvas against the cover height
const SCENE_HEIGHT = 1.2;

// How far the camera sits from the middle notebooks. Farther away flattens
// the perspective, closer makes the side notebooks shrink faster
const CAMERA_DISTANCE = 5;
const CAMERA_FOV =
  (2 * Math.atan(SCENE_HEIGHT / 2 / CAMERA_DISTANCE) * 180) / Math.PI;

// Notebooks further back blend into the band's grey, starting just behind
// the middle notebooks and fully grey at FOG_FAR from the camera
const FOG_COLOR = "rgb(243, 243, 243)";
const FOG_NEAR = CAMERA_DISTANCE + 0.2;
const FOG_FAR = CAMERA_DISTANCE + 2.5;

// The template carousel drawn in 3D, in one canvas across the band. Its
// notebooks are what's seen and clicked
export function TemplateCarouselScene({
  covers,
  isJumping,
  focusedCover,
  openedCover,
  readRectRef,
  onOpenCover,
}: TemplateCarouselSceneProps) {
  return (
    <div
      className="template-carousel-scene"
      style={{ "--scene-height": SCENE_HEIGHT } as React.CSSProperties}
    >
      {/* flat keeps the covers' real colors, instead of three.js's default
          film-like color change that darkens them. demand draws only when
          something changes, instead of every frame */}
      <Canvas
        flat
        frameloop="demand"
        camera={{ position: [0, 0, CAMERA_DISTANCE], fov: CAMERA_FOV }}
        dpr={[1, 2]}
      >
        <fog attach="fog" args={[FOG_COLOR, FOG_NEAR, FOG_FAR]} />
        <ambientLight intensity={AMBIENT_LIGHT_STRENGTH} />
        <directionalLight
          position={MAIN_LIGHT_POSITION}
          intensity={MAIN_LIGHT_STRENGTH}
        />

        {covers.map(({ coverStyle, offset }) => (
          <CarouselNotebook
            key={coverStyle}
            coverStyle={coverStyle}
            offset={offset}
            isJumping={isJumping}
            isFocused={coverStyle === focusedCover}
            isOpened={coverStyle === openedCover}
            onOpen={() => onOpenCover(coverStyle)}
          />
        ))}

        <CoverScreenRect readRectRef={readRectRef} />

        <ContactShadows
          position={[0, -NOTEBOOK_HEIGHT / 2, 0]}
          opacity={SHADOW_OPACITY}
          blur={SHADOW_BLUR}
          scale={[12, 3]}
        />
      </Canvas>
    </div>
  );
}
