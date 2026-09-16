"use client";

import { useEffect } from "react";

// Listens for app-wide keyboard shortcuts (currently just a dev shortcut to wipe the local database).
export function GlobalShortcuts() {
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === "D") {
        event.preventDefault();

        indexedDB.deleteDatabase("notebook-db");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
