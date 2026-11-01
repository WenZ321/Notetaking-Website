import type { NotebookSummary } from "@/types/Notebook";
import { NOTEBOOK_COVER_STYLES } from "@/constants/NotebookCoverStyles";
import { NotebookModel } from "../NotebookModel/NotebookModel";
import { SHELF_NOTEBOOK_THICKNESS } from "./BookshelfLook";
import { SpineTitle } from "./SpineTitle";

type ShelfNotebookProps = {
  notebook: NotebookSummary;
  position: [number, number, number]; // its middle, standing on the shelf
};

// A spine-out notebook turns a quarter so its spine faces you
const SPINE_OUT_TURN = Math.PI / 2;

// A saved notebook standing spine-out on the bookshelf, thicker than the
// carousel's, with its title along the spine
export function ShelfNotebook({ notebook, position }: ShelfNotebookProps) {
  const { colors } = NOTEBOOK_COVER_STYLES[notebook.coverStyle];

  return (
    <group position={position} rotation={[0, SPINE_OUT_TURN, 0]}>
      <NotebookModel colors={colors} thickness={SHELF_NOTEBOOK_THICKNESS} />
      <SpineTitle title={notebook.title} spineColor={colors.spine} />
    </group>
  );
}
