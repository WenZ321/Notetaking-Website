import type { NotebookPaperType } from "@/types/Notebook";
import { useLayoutEffect, useRef, useState } from "react";
import { NotebookPaper } from "@/components/NotebookPaperTypes/NotebookPaper";
import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_VARIABLES,
} from "@/constants/NotebookPageConstants";
import "./PaperPreview.css";

type PaperPreviewProps = {
  paperType: NotebookPaperType;
};

/**
 * A paper type drawn at full page size, then shrunk to fill its box,
 * so the lines and squares look the same as in a real notebook
 */
export function PaperPreview({ paperType }: PaperPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  // Keeps the paper filling the box's height whenever the box changes size
  useLayoutEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    const observer = new ResizeObserver(() => {
      setScale(preview.clientHeight / NOTEBOOK_PAGE_HEIGHT);
    });
    observer.observe(preview);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={previewRef}
      className="user-notebooks-page-paper-preview"
      style={
        {
          ...NOTEBOOK_PAGE_VARIABLES,
          "--paper-preview-scale": scale,
        } as React.CSSProperties
      }
    >
      <div className="user-notebooks-page-paper-preview-page">
        <NotebookPaper paperType={paperType} />
      </div>
    </div>
  );
}
