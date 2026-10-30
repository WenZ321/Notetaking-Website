import { createPortal } from "react-dom";
import "./OpeningNotebook.css";

type OpeningNotebookProps = {
  coverClassName: string; // The clicked template's cover style
  startRect: DOMRect; // Where the clicked template sits on screen, so the notebook starts there
  onClose: () => void;
};

/**
 * The clicked template glides to the center of the page, then opens like a notebook.
 * Closes when the dimmed space around it is clicked
 */
export function OpeningNotebook({
  coverClassName,
  startRect,
  onClose,
}: OpeningNotebookProps) {
  // How far the template's center is from the page's center, where the notebook glides from
  const startX = startRect.left + startRect.width / 2 - window.innerWidth / 2;
  const startY = startRect.top + startRect.height / 2 - window.innerHeight / 2;

  // Only clicks on the dimmed space itself close it, not clicks on the notebook
  function handleBackdropClick(event: React.MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  // Rendered on the body so the carousel's 3D and hover styles never reach it
  return createPortal(
    <div
      className="user-notebooks-page-opening-notebook-backdrop"
      onClick={handleBackdropClick}
    >
      <div
        className={`user-notebooks-page-opening-notebook ${coverClassName}`}
        style={
          {
            "--start-x": `${startX}px`,
            "--start-y": `${startY}px`,
          } as React.CSSProperties
        }
      >
        {/* The right page sits on the back cover, under the front cover until it opens */}
        <div className="user-notebooks-page-opening-notebook-back-cover">
          <div className="user-notebooks-page-opening-notebook-page" />
        </div>

        {/* The front cover swings over to the left, showing its inside with the left page */}
        <div className="user-notebooks-page-opening-notebook-cover">
          <div className="user-notebooks-page-opening-notebook-cover-front" />
          <div className="user-notebooks-page-opening-notebook-cover-inside">
            <div className="user-notebooks-page-opening-notebook-page" />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
