import type { NotebookCoverStyle } from "@/types/Notebook";
import { getCoverColorVariables } from "@/constants/NotebookCoverStyles";
import "./NotebookCover.css";

type NotebookCoverProps = {
  coverStyle: NotebookCoverStyle;
};

// Front cover shown before the notebook is opened
export function NotebookCover({ coverStyle }: NotebookCoverProps) {
  return (
    <div
      className="notebook-page-closed-cover"
      style={getCoverColorVariables(coverStyle)}
    />
  );
}
