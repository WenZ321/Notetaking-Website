import type { ComponentType } from "react";
import type { NotebookPaperType } from "@/types/Notebook";
import type { SnapBlockSide } from "./PaperLogic/PaperSnapping";
import { keepLength } from "./PaperLogic/PaperSnapping";
import { snapToGraphSquares } from "./PaperLogic/GraphPaperSnapping";
import { GRAPH_PAPER_SQUARE_SIZE } from "@/constants/NotebookPageConstants";
import { BlankPaper } from "./BlankPaper";
import { LinedPaper } from "./LinedPaper";
import { GraphPaper } from "./GraphPaper";
import { DotGridPaper } from "./DotGridPaper";

type NotebookPaperTypeDefinition = {
  label: string;
  Paper: ComponentType;
  snapBlockSide: SnapBlockSide; // How block sizes fit this paper when inserted or resized
  blockTopStep: number; // How far apart the lines a block can start on are, 1 lets it start anywhere
};

// Every paper type the app offers, in the order the template tiles show them
export const NOTEBOOK_PAPER_TYPES: Record<
  NotebookPaperType,
  NotebookPaperTypeDefinition
> = {
  blank: {
    label: "Blank",
    Paper: BlankPaper,
    snapBlockSide: keepLength,
    blockTopStep: 1,
  },
  lined: {
    label: "Lined",
    Paper: LinedPaper,
    snapBlockSide: keepLength,
    blockTopStep: 1,
  },
  graph: {
    label: "Graph",
    Paper: GraphPaper,
    snapBlockSide: snapToGraphSquares,
    blockTopStep: GRAPH_PAPER_SQUARE_SIZE,
  },
  dotGrid: {
    label: "Dot grid",
    Paper: DotGridPaper,
    snapBlockSide: keepLength,
    blockTopStep: 1,
  },
};

// The snapping of a page's paper
export function getPaperSnapBlockSide(
  paperType: NotebookPaperType,
): SnapBlockSide {
  return NOTEBOOK_PAPER_TYPES[paperType].snapBlockSide;
}

// How far apart the lines a block can start on are, on a page's paper
export function getPaperBlockTopStep(paperType: NotebookPaperType): number {
  return NOTEBOOK_PAPER_TYPES[paperType].blockTopStep;
}
