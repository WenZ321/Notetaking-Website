import "./NotebookHeaderBar.css";
import LogoLink from "../LogoLink";
import { useState } from "react";

type MenuBarProps = {
  notebookID: string;
  currentTitle: string;
  updateNotebookTitle: (id: string, title: string) => void;
};

/**
 * The header bar at the top of the notebook page that contains the logo, title, and menu buttons
 */
export default function NotebookHeaderBar({
  notebookID,
  currentTitle,
  updateNotebookTitle,
}: MenuBarProps) {
  const [title, setTitle] = useState(currentTitle);

  return (
    <div className="notebook-page-header-bar">
      <LogoLink pageLink="/notebooks" />
      <input
        className="notebook-page-header-title"
        type="text"
        value={title}
        placeholder="(untilted)"
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => updateNotebookTitle(notebookID, title)}
      />
      <button className="notebook-page-header-button"> File </button>
      <button className="notebook-page-header-button"> Edit </button>
      <button className="notebook-page-header-button"> View </button>
      <button className="notebook-page-header-button"> Format </button>
    </div>
  );
}
