import "./MenuBar.css";
import LogoLink from "./LogoLink";
import { useState } from "react";

type MenuBarProps = {
  notebookID: string;
  currentTitle: string;
  updateNotebookTitle: (id: string, title: string) => void;
};

export default function MenuBar({
  notebookID,
  currentTitle,
  updateNotebookTitle,
}: MenuBarProps) {
  const [title, setTitle] = useState(currentTitle);

  return (
    <div className="menu-bar">
      <LogoLink />
      <input
        className="notebook-title"
        type="text"
        placeholder="(untilted)"
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => updateNotebookTitle(notebookID, title)}
      />
      <button className="menu-button"> File </button>
      <button className="menu-button"> Edit </button>
      <button className="menu-button"> View </button>
      <button className="menu-button"> Format </button>
    </div>
  );
}
