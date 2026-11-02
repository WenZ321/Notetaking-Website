"use client";

import { useEffect } from "react";

// Starts loading the notebooks page's 3D scenes once the browser is idle,
// so going there later doesn't wait for three.js to download and start up.
// The notebooks page loads the same files, which the browser keeps only once
export function Preload3DScenes() {
  useEffect(() => {
    const idleId = requestIdleCallback(() => {
      import("@/components/3DScene/Bookshelf/BookshelfScene/BookshelfScene");
      import("@/components/3DScene/TemplateCarousel/TemplateCarouselScene");
    });
    return () => cancelIdleCallback(idleId);
  }, []);

  return null;
}
