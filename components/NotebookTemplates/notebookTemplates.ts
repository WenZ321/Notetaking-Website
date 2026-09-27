import type { ComponentType } from "react";
import type { NotebookTemplate } from "@/types/notebook";
import { BlankPaper } from "./BlankPaper";
import { LinedPaper } from "./LinedPaper";
import { GraphPaper } from "./GraphPaper";
import { DotGridPaper } from "./DotGridPaper";

type NotebookTemplateDefinition = {
  label: string;
  Paper: ComponentType;
};

// Every template the app offers, in the order the template tiles show them
export const NOTEBOOK_TEMPLATES: Record<
  NotebookTemplate,
  NotebookTemplateDefinition
> = {
  blank: { label: "Blank", Paper: BlankPaper },
  lined: { label: "Lined", Paper: LinedPaper },
  graph: { label: "Graph", Paper: GraphPaper },
  dotGrid: { label: "Dot grid", Paper: DotGridPaper },
};
