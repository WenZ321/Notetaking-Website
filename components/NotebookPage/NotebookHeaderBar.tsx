import { useState, ViewTransition } from "react";
import { LogoLink } from "../LogoLink";
import "./NotebookHeaderBar.css";

type NotebookHeaderBarProps = {
  notebookId: string;
  currentTitle: string;
  updateNotebookTitle: (id: string, title: string) => void;
};

/**
 * The header bar at the top of the notebook page that contains the logo, title, and menu buttons
 */
export function NotebookHeaderBar({
  notebookId,
  currentTitle,
  updateNotebookTitle,
}: NotebookHeaderBarProps) {
  const [title, setTitle] = useState(currentTitle);

  return (
    <div className="notebook-page-header-bar">
      <LogoLink pageLink="/userNotebooks" />
      {/* The same name as the editing page's title, so it stays still
          while the rest of the page crossfades */}
      <ViewTransition name="notebook-title">
        <input
          className="notebook-page-header-title"
          type="text"
          value={title}
          placeholder="(untitled)"
          onChange={(e) => {
            setTitle(e.target.value);
            updateNotebookTitle(notebookId, e.target.value);
          }}
        />
      </ViewTransition>
      <button className="notebook-page-header-button"> File </button>
      <button className="notebook-page-header-button"> Edit </button>
      <button className="notebook-page-header-button"> View </button>
      <button className="notebook-page-header-button"> Format </button>
    </div>
  );
}
