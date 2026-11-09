import type { NotebookCoverStyle, NotebookPaperType } from "@/types/Notebook";
import { useState } from "react";
import { createPortal } from "react-dom";
import { getCoverColorVariables } from "@/constants/NotebookCoverStyles";
import { PaperPreview } from "./PaperPreview";
import { PaperTypePicker } from "./PaperTypePicker";
import "./OpeningNotebook.css";

type OpeningNotebookProps = {
  coverStyle: NotebookCoverStyle; // The clicked template's cover style
  startRect: DOMRect; // Where the clicked template sits on screen, so the notebook starts there
  onCreate: (title: string, paperType: NotebookPaperType) => void;
  onClosedToCreate: (coverRect: DOMRect) => void; // where the closed cover ended up
  onClose: () => void;
};

/**
 * The clicked template glides to the center of the page, then opens like a notebook.
 * Clicking the dimmed space around it closes the notebook and glides it back to the template.
 * Creating closes it where it is instead
 */
export function OpeningNotebook({
  coverStyle,
  startRect,
  onCreate,
  onClosedToCreate,
  onClose,
}: OpeningNotebookProps) {
  // How far the template's center is from the page's center, where the notebook glides from
  const startX = startRect.left + startRect.width / 2 - window.innerWidth / 2;
  const startY = startRect.top + startRect.height / 2 - window.innerHeight / 2;

  const [paperType, setPaperType] = useState<NotebookPaperType>("blank");
  const [title, setTitle] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // On once the notebook has fully opened, so clicking away can't cut the opening short
  const [isOpen, setIsOpen] = useState(false);

  // Close popup when we click out of the notebook
  function handleBackdropClick(event: React.MouseEvent) {
    if (
      event.target === event.currentTarget &&
      isOpen &&
      !isClosing &&
      !isCreating
    ) {
      setIsClosing(true);
    }
  }

  function handleCreateClick() {
    setIsCreating(true);
    onCreate(title, paperType);
  }

  // The shift to the center is the last opening animation to finish, and
  // shifting back is the last one when closing to create
  function handleAnimationEnd(event: React.AnimationEvent) {
    // a reduced motion animation counts as the one it stands in for
    const animationName = event.animationName.replace(/-reduced$/, "");
    if (animationName === "user-notebooks-page-opening-notebook-center") {
      if (isCreating)
        onClosedToCreate(event.currentTarget.getBoundingClientRect());
      else if (!isClosing) setIsOpen(true);
    }

    // Remove popup after closing animation finishes
    if (
      isClosing &&
      animationName === "user-notebooks-page-opening-notebook-move"
    ) {
      onClose();
    }
  }

  // Rendered on the body so the carousel's 3D and hover styles never reach it
  return createPortal(
    <div
      className="user-notebooks-page-opening-notebook-backdrop"
      data-closing={isClosing || isCreating}
      onClick={handleBackdropClick}
    >
      <div
        key={isClosing ? "closing" : isCreating ? "creating" : "opening"}
        className="user-notebooks-page-opening-notebook"
        data-closing={isClosing}
        data-creating={isCreating}
        onAnimationEnd={handleAnimationEnd}
        style={
          {
            ...getCoverColorVariables(coverStyle),
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
              disabled={isCreating}
              onClick={handleCreateClick}
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
