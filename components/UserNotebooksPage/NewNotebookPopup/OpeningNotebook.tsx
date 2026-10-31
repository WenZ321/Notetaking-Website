import type { NotebookPaperType } from "@/types/Notebook";
import { useState } from "react";
import { createPortal } from "react-dom";
import { PaperPreview } from "./PaperPreview";
import { PaperTypePicker } from "./PaperTypePicker";
import "./OpeningNotebook.css";

type OpeningNotebookProps = {
  coverClassName: string; // The clicked template's cover style
  startRect: DOMRect; // Where the clicked template sits on screen, so the notebook starts there
  onCreate: (title: string, paperType: NotebookPaperType) => void;
  onClose: () => void;
};

/**
 * The clicked template glides to the center of the page, then opens like a notebook.
 * Clicking the dimmed space around it closes the notebook and glides it back to the template
 */
export function OpeningNotebook({
  coverClassName,
  startRect,
  onCreate,
  onClose,
}: OpeningNotebookProps) {
  // How far the template's center is from the page's center, where the notebook glides from
  const startX = startRect.left + startRect.width / 2 - window.innerWidth / 2;
  const startY = startRect.top + startRect.height / 2 - window.innerHeight / 2;

  const [paperType, setPaperType] = useState<NotebookPaperType>("blank");
  const [title, setTitle] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  // On once the notebook has fully opened, so clicking away can't cut the opening short
  const [isOpen, setIsOpen] = useState(false);

  // Close popup when we click out of the notebook
  function handleBackdropClick(event: React.MouseEvent) {
    if (event.target === event.currentTarget && isOpen && !isClosing) {
      setIsClosing(true);
    }
  }

  // The shift to the center is the last opening animation to finish
  function handleAnimationEnd(event: React.AnimationEvent) {
    if (
      !isClosing &&
      event.animationName === "user-notebooks-page-opening-notebook-center"
    ) {
      setIsOpen(true);
    }

    // Remove popup after closing animation finishes
    if (
      isClosing &&
      event.animationName === "user-notebooks-page-opening-notebook-move"
    ) {
      onClose();
    }
  }

  // Rendered on the body so the carousel's 3D and hover styles never reach it
  return createPortal(
    <div
      className="user-notebooks-page-opening-notebook-backdrop"
      data-closing={isClosing}
      onClick={handleBackdropClick}
    >
      <div
        key={isClosing ? "closing" : "opening"}
        className={`user-notebooks-page-opening-notebook ${coverClassName}`}
        data-closing={isClosing}
        onAnimationEnd={handleAnimationEnd}
        style={
          {
            "--start-x": `${startX}px`,
            "--start-y": `${startY}px`,
          } as React.CSSProperties
        }
      >
        {/* Right page */}
        <div className="user-notebooks-page-opening-notebook-back-cover">
          <div className="user-notebooks-page-opening-notebook-page">
            <PaperPreview paperType={paperType} />

            <button
              className="user-notebooks-page-opening-notebook-create-button"
              onClick={() => onCreate(title, paperType)}
            >
              Create
            </button>
          </div>
        </div>

        {/* Left page (animated) */}
        <div className="user-notebooks-page-opening-notebook-cover">
          <div className="user-notebooks-page-opening-notebook-cover-front" />
          <div className="user-notebooks-page-opening-notebook-cover-inside">
            <div className="user-notebooks-page-opening-notebook-page">
              <PaperPreview paperType={paperType} />

              <div className="user-notebooks-page-opening-notebook-form">
                <input
                  className="user-notebooks-page-opening-notebook-title-input"
                  value={title}
                  placeholder="Untitled Notebook"
                  aria-label="Notebook name"
                  onChange={(event) => setTitle(event.target.value)}
                />

                <PaperTypePicker
                  pickedPaperType={paperType}
                  onPick={setPaperType}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
