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

// Everything in here will be rendered on all other pages, children are the different sites.
// Changing pages crossfades from the old page to the new one, except when
// the zoom between the notebook view and the editor carries it
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
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
