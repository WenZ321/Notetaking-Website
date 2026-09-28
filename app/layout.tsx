import type { Metadata } from "next";
import { GlobalShortcuts } from "./GlobalShortcuts";
import {
  NOTEBOOK_PAGE_HEIGHT,
  NOTEBOOK_PAGE_WIDTH,
} from "@/constants/notebookPageConstants";
import "./fonts.css";
import "./globals.css";
import "./notebookPageText.css";

export const metadata: Metadata = {
  title: "Notebook Website",
  description: "A website to replicate the functionality of a notebook.",
};

// Everything in here will be rendered on all other pages, children are the different sites
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <GlobalShortcuts />
      {/* Page size as CSS variables once for the whole app, from the same constants the code uses */}
      <body
        style={
          {
            "--notebook-page-width": `${NOTEBOOK_PAGE_WIDTH}px`,
            "--notebook-page-height": `${NOTEBOOK_PAGE_HEIGHT}px`,
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
