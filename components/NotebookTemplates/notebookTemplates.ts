import type { ComponentType } from "react";
import type { NotebookTemplate } from "@/types/notebook";
import type { SnapBlockSide } from "./PaperLogic/paperSnapping";
import { keepLength } from "./PaperLogic/paperSnapping";
import { snapToGraphSquares } from "./PaperLogic/graphPaperSnapping";
import { BlankPaper } from "./BlankPaper";
import { LinedPaper } from "./LinedPaper";
import { GraphPaper } from "./GraphPaper";
import { DotGridPaper } from "./DotGridPaper";

type NotebookTemplateDefinition = {
  label: string;
  Paper: ComponentType;
  snapBlockSide: SnapBlockSide; // How block sizes fit this paper when inserted or resized
};

// Every template the app offers, in the order the template tiles show them
export const NOTEBOOK_TEMPLATES: Record<
  NotebookTemplate,
  NotebookTemplateDefinition
> = {
  blank: { label: "Blank", Paper: BlankPaper, snapBlockSide: keepLength },
  lined: { label: "Lined", Paper: LinedPaper, snapBlockSide: keepLength },
  graph: {
    label: "Graph",
    Paper: GraphPaper,
    snapBlockSide: snapToGraphSquares,
  },
  dotGrid: {
    label: "Dot grid",
    Paper: DotGridPaper,
    snapBlockSide: keepLength,
  },
};

// The snapping of a page's paper
export function getPaperSnapBlockSide(
  template: NotebookTemplate,
): SnapBlockSide {
  return NOTEBOOK_TEMPLATES[template].snapBlockSide;
}
