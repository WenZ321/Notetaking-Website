import type { CSSProperties } from "react";
import type {
  NotebookCoverColors,
  NotebookCoverStyle,
} from "@/types/Notebook";

type NotebookCoverStyleDefinition = {
  label: string;
  colors: NotebookCoverColors;
};

// A cover that's one color on its front, inside and spine
function plainCover(label: string, color: string): NotebookCoverStyleDefinition {
  return { label, colors: { front: color, inside: color, spine: color } };
}

// Every cover style the app offers, in the order the template tiles show
// them. The 3D notebooks and the flat CSS covers both take their colors from here
export const NOTEBOOK_COVER_STYLES: Record<
  NotebookCoverStyle,
  NotebookCoverStyleDefinition
> = {
  red: plainCover("Red", "#a3302c"),
  blue: plainCover("Blue", "#234a7a"),
  green: plainCover("Green", "#2f5d45"),
  yellow: plainCover("Yellow", "#c9a227"),
  purple: plainCover("Purple", "#5b3f7a"),
  orange: plainCover("Orange", "#c46a2b"),
  teal: plainCover("Teal", "#2a6f73"),
  pink: plainCover("Pink", "#b5577a"),
  brown: plainCover("Brown", "#7a5233"),
  gray: plainCover("Gray", "#5f6368"),
  lavender: plainCover("Lavender", "#8c7bb8"),
  mint: plainCover("Mint", "#5fa38a"),
};

// A cover's colors as the CSS variables its flat pieces read, set on the
// element whose front, inside and spine are drawn in that cover
export function getCoverColorVariables(
  coverStyle: NotebookCoverStyle,
): CSSProperties {
  const { front, inside, spine } = NOTEBOOK_COVER_STYLES[coverStyle].colors;
  return {
    "--cover-front-background": front,
    "--cover-inside-background": inside,
    "--cover-spine-background": spine,
  } as CSSProperties;
}
