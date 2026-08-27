import "./NotebookMenuBar.css";
import LogoLink from "../LogoLink";
import { useState } from "react";

type MenuBarProps = {
  notebookID: string;
  currentTitle: string;
  updateNotebookTitle: (id: string, title: string) => void;
};

/**
 * The menu bar at the top of the notebook page that contains the logo, title, and menu buttons
 */
export default function NotebookMenuBar({
  notebookID,
  currentTitle,
  updateNotebookTitle,
}: MenuBarProps) {
  const [title, setTitle] = useState(currentTitle);

  return (
    <div className="notebook-menu-bar">
      <LogoLink />
      <input
        className="notebook-title"
        type="text"
        value={title}
        placeholder="(untilted)"
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => updateNotebookTitle(notebookID, title)}
      />
      <button className="notebook-menu-button"> File </button>
      <button className="notebook-menu-button"> Edit </button>
      <button className="notebook-menu-button"> View </button>
      <button className="notebook-menu-button"> Format </button>
    </div>
  );
}
