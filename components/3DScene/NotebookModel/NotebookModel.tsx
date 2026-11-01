import type { NotebookCoverColors } from "@/types/Notebook";
import { Color } from "three";
import { Edges } from "@react-three/drei";
import {
  COVER_BOARD_THICKNESS,
  COVER_OVERHANG,
  COVER_ROUGHNESS,
  NOTEBOOK_HEIGHT,
  NOTEBOOK_WIDTH,
  OUTLINE_SHADE,
  OUTLINE_WIDTH,
  PAGE_COLOR,
  PAGE_ROUGHNESS,
} from "./NotebookLook";

type NotebookModelProps = {
  colors: NotebookCoverColors;
  thickness: number; // from cover to cover, in scene units
};

type NotebookPartProps = {
  size: [number, number, number];
  position: [number, number, number];
  color: string;
  roughness: number;
};

// The pages sit between the covers, back from the covers' outer edges
const PAGES_WIDTH = NOTEBOOK_WIDTH - COVER_BOARD_THICKNESS - COVER_OVERHANG;
const PAGES_HEIGHT = NOTEBOOK_HEIGHT - 2 * COVER_OVERHANG;

// The covers reach from the spine to the notebook's right edge
const COVER_WIDTH = NOTEBOOK_WIDTH - COVER_BOARD_THICKNESS;

// One box of the notebook, with a line along its edges in a darker shade
// of its color
function NotebookPart({ size, position, color, roughness }: NotebookPartProps) {
  const edgeColor = new Color(color).multiplyScalar(OUTLINE_SHADE);

  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} />
      <Edges lineWidth={OUTLINE_WIDTH} color={edgeColor} />
    </mesh>
  );
}

// A closed notebook standing upright, its front cover facing you and its
// spine on the left. Its middle sits at the origin
export function NotebookModel({ colors, thickness }: NotebookModelProps) {
  const coverZ = thickness / 2 - COVER_BOARD_THICKNESS / 2;
  const pagesThickness = thickness - 2 * COVER_BOARD_THICKNESS;

  return (
    <group>
      {/* front and back covers, starting where the spine ends so no two
          parts share a surface, which would flicker */}
      {[coverZ, -coverZ].map((z) => (
        <NotebookPart
          key={z}
          size={[COVER_WIDTH, NOTEBOOK_HEIGHT, COVER_BOARD_THICKNESS]}
          position={[COVER_BOARD_THICKNESS / 2, 0, z]}
          color={colors.front}
          roughness={COVER_ROUGHNESS}
        />
      ))}

      {/* the spine joining the covers on the left */}
      <NotebookPart
        size={[COVER_BOARD_THICKNESS, NOTEBOOK_HEIGHT, thickness]}
        position={[-NOTEBOOK_WIDTH / 2 + COVER_BOARD_THICKNESS / 2, 0, 0]}
        color={colors.spine}
        roughness={COVER_ROUGHNESS}
      />

      {/* the block of pages, against the spine */}
      <NotebookPart
        size={[PAGES_WIDTH, PAGES_HEIGHT, pagesThickness]}
        position={[
          -NOTEBOOK_WIDTH / 2 + COVER_BOARD_THICKNESS + PAGES_WIDTH / 2,
          0,
          0,
        ]}
        color={PAGE_COLOR}
        roughness={PAGE_ROUGHNESS}
      />
    </group>
  );
}
