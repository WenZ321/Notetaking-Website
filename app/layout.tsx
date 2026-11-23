import type { Metadata } from "next";
import { ViewTransition } from "react";
import { GlobalShortcuts } from "./GlobalShortcuts";
import { Preload3DScenes } from "@/components/3DScene/Preload3DScenes";
import { ReducedMotionSwitch } from "@/components/ReducedMotion/ReducedMotionSwitch";
import { REDUCED_MOTION_SCRIPT } from "@/components/ReducedMotion/ReducedMotion";
import { NOTEBOOK_ZOOM_TRANSITION } from "@/components/NotebookPage/NotebookZoomTransition";
import { NOTEBOOK_PAGE_HEIGHT } from "@/constants/NotebookPageConstants";
import "./fonts.css";
import "./globals.css";
import "./scrapbook.css";
import "./notebookPageText.css";

export const metadata: Metadata = {
  title: "Erimere",
  description: "A website to replicate the functionality of a notebook.",
  icons: {
    icon: "/brand/erimere-app-icon.svg",
    apple: "/brand/erimere-app-icon.png",
  },
};

// Sets the interface's size from the window's width, so it takes the same
// share of any screen as it does on one 1512px wide, never smaller and at
// most 3 times bigger. It runs before the page is first drawn, so nothing
// jumps, and again whenever the window is resized
//
// The editor's notebook takes that size too, but shrinks so the whole page
// and its rim fit under the toolbar, down to three quarters of its real size.
// Below that the writing gets hard to read, so the view scrolls instead
const UI_SCALE_SCRIPT = `
(() => {
  const setScale = () => {
    const root = document.documentElement;
    const scale = Math.min(3, Math.max(1, root.clientWidth / 1512));
    root.style.setProperty("--ui-scale", String(scale));

    const styles = getComputedStyle(root);
    const read = (name) => parseFloat(styles.getPropertyValue(name));
    const toolsHeight =
      (read("--header-height") + read("--toolbar-height") + read("--space-2")) * scale;
    const roomAroundPage = 2 * (read("--notebook-rim-thickness") + read("--space-4"));
    const pageBorders = 2 * read("--editor-page-border");
    const fitScale =
      (root.clientHeight - toolsHeight - pageBorders) /
      (${NOTEBOOK_PAGE_HEIGHT} + roomAroundPage);
    const editorScale = Math.min(scale, Math.max(0.75, fitScale));
    root.style.setProperty("--editor-notebook-scale", String(editorScale));
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
    // the scripts above add the scale and reduced motion to this element
    // before React starts
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: UI_SCALE_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: REDUCED_MOTION_SCRIPT }} />
      </head>
      <GlobalShortcuts />
      <body>
        <Preload3DScenes />
        <ReducedMotionSwitch />
        <ViewTransition
          default={{ [NOTEBOOK_ZOOM_TRANSITION]: "none", default: "auto" }}
        >
          {children}
        </ViewTransition>
      </body>
    </html>
  );
}
