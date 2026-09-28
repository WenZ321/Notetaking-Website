import { useState } from "react";
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
      <input
        className="notebook-page-header-title"
        type="text"
        value={title}
        placeholder="(untilted)"
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => updateNotebookTitle(notebookId, title)}
      />
      <button className="notebook-page-header-button"> File </button>
      <button className="notebook-page-header-button"> Edit </button>
      <button className="notebook-page-header-button"> View </button>
      <button className="notebook-page-header-button"> Format </button>
    </div>
  );
}
