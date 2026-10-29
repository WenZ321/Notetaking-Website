import type { NotebookCoverStyle } from "@/types/Notebook";
import { NOTEBOOK_COVER_STYLES } from "@/components/NotebookCoverStyles/NotebookCoverStyles";
import "./NotebookCover.css";

type NotebookCoverProps = {
  coverStyle: NotebookCoverStyle;
};

// Front cover shown before the notebook is opened
export function NotebookCover({ coverStyle }: NotebookCoverProps) {
  const { className } = NOTEBOOK_COVER_STYLES[coverStyle];

  return <div className={`notebook-page-closed-cover ${className}`} />;
}
