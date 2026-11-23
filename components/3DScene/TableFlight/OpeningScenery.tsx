import type { Material, Texture } from "three";
import { RepeatWrapping, SRGBColorSpace, TextureLoader } from "three";
import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { easeInOutQuart } from "../EasingStep";
import { NOTEBOOK_HEIGHT } from "../NotebookModel/NotebookLook";
import {
  SURROUND_FADE_MS,
  TABLE_BACK,
  TABLE_COLOR,
  TABLE_ROUGHNESS,
  TABLE_SIZE,
  TABLE_TEXTURE_URL,
  TABLE_TILE_WIDTH_PX,
  WALL_COLOR,
} from "./TableFlightLook";

type OpeningSceneryProps = {
  tableTop: number;
  wallZ: number; // how far back the wall is
  flightStartedAt: number | null;
  landingRect: DOMRect; // where the notebook view's cover is on screen
};

// Big enough that the wall reaches well past the edges of the view
const WALL_SIZE = 100;

// What only exists while a notebook opens: the wall and the table, which
// fade in over the page while the notebook flies down onto the table
export function OpeningScenery({
  tableTop,
  wallZ,
  flightStartedAt,
  landingRect,
}: OpeningSceneryProps) {
  const invalidate = useThree((state) => state.invalidate);
  const surroundRef = useRef<Material>(null);
  const tableRef = useRef<Material>(null);
  const tableTexture = useTableTexture(landingRect);

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
        {/* A material only takes on a texture when it's first built, so a
            new one is made once the scan has loaded */}
        <meshStandardMaterial
          key={tableTexture ? "oak" : "plain"}
          ref={tableRef}
          color={tableTexture ? "white" : TABLE_COLOR}
          map={tableTexture}
          roughness={TABLE_ROUGHNESS}
          transparent
          opacity={0}
        />
      </mesh>
    </>
  );
}

// The oak scan for the table's top, tiled so its grain is as big on screen
// as the desk's once the notebook has landed. Null until it has loaded
function useTableTexture(landingRect: DOMRect) {
  const invalidate = useThree((state) => state.invalidate);
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    const pixelsPerUnit = landingRect.height / NOTEBOOK_HEIGHT;
    const tileWidth = TABLE_TILE_WIDTH_PX / pixelsPerUnit;
    let loaded: Texture | null = null;

    new TextureLoader().load(TABLE_TEXTURE_URL, (oak) => {
      // the scan is wider than tall, so a tile is shallower than it is wide
      const tileDepth = tileWidth * (oak.image.height / oak.image.width);
      oak.colorSpace = SRGBColorSpace;
      oak.wrapS = RepeatWrapping;
      oak.wrapT = RepeatWrapping;
      oak.repeat.set(TABLE_SIZE[0] / tileWidth, TABLE_SIZE[2] / tileDepth);
      loaded = oak;
      setTexture(oak);
      invalidate();
    });

    return () => loaded?.dispose();
  }, [landingRect, invalidate]);

  return texture;
}
