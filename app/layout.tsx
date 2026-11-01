import type { Metadata } from "next";
import { ViewTransition } from "react";
import { GlobalShortcuts } from "./GlobalShortcuts";
import "./fonts.css";
import "./globals.css";
import "./notebookPageText.css";

export const metadata: Metadata = {
  title: "Notebook Website",
  description: "A website to replicate the functionality of a notebook.",
};

// Everything in here will be rendered on all other pages, children are the different sites.
// Changing pages crossfades from the old page to the new one
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <GlobalShortcuts />
      <body>
        <ViewTransition>{children}</ViewTransition>
      </body>
    </html>
  );
}
