import type { Metadata } from "next";
import { ViewTransition } from "react";
import { GlobalShortcuts } from "./GlobalShortcuts";
import { Preload3DScenes } from "@/components/3DScene/Preload3DScenes";
import { NOTEBOOK_ZOOM_TRANSITION } from "@/components/NotebookPage/NotebookZoomTransition";
import "./fonts.css";
import "./globals.css";
import "./notebookPageText.css";

export const metadata: Metadata = {
  title: "Notebook Website",
  description: "A website to replicate the functionality of a notebook.",
};

// Sets the interface's size from the window's width, so it takes the same
// share of any screen as it does on one 1512px wide, never smaller and at
// most 3 times bigger. It runs before the page is first drawn, so nothing
// jumps, and again whenever the window is resized
const UI_SCALE_SCRIPT = `
(() => {
  const setScale = () => {
    const scale = Math.min(3, Math.max(1, document.documentElement.clientWidth / 1512));
    document.documentElement.style.setProperty("--ui-scale", String(scale));
  };
  setScale();
  window.addEventListener("resize", setScale);
})();
`;

// Everything in here will be rendered on all other pages, children are the different sites.
// Changing pages crossfades from the old page to the new one, except when
// the zoom between the notebook view and the editor carries it
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // the script above adds the scale to this element before React starts
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: UI_SCALE_SCRIPT }} />
      </head>
      <GlobalShortcuts />
      <body>
        <Preload3DScenes />
        <ViewTransition
          default={{ [NOTEBOOK_ZOOM_TRANSITION]: "none", default: "auto" }}
        >
          {children}
        </ViewTransition>
      </body>
    </html>
  );
}
