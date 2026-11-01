"use client";

import type { MouseEvent } from "react";
import type { NotebookSummary } from "@/types/Notebook";
import type { Opening } from "./Bookshelf";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { AMBIENT_LIGHT_STRENGTH } from "../NotebookModel/NotebookLook";
import {
  ONE_ROW_SHELF_HEIGHT,
  OPEN_FLIGHT_MS,
  OPEN_SLIDE_MS,
  ROW_HEIGHT_SHARE,
  SHELF_WIDTH_SHARE,
  WALL_MARGIN_X,
  WALL_MARGIN_Y,
} from "./BookshelfLook";
import { Bookshelf } from "./Bookshelf";
import { getShelfLayout } from "./ShelfLayout";
import "./BookshelfScene.css";

type BookshelfSceneProps = {
  notebooks: NotebookSummary[];
  // called once the opening animation is done, to go to the notebook
  onOpenNotebook: (notebookId: string) => void;
};

// Calls back when the window is resized, for the window size below
function subscribeToResize(onResize: () => void) {
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}

// The library's bookshelf drawn in 3D, in its own canvas, with a hidden link
// per notebook for the keyboard and screen readers. It has rows for all the
// notebooks, and the canvas grows to fit them. It fades in once the 3D is
// ready, instead of popping in. Choosing a notebook plays its opening, with
// the canvas covering the window, then goes to it
export function BookshelfScene({
  notebooks,
  onOpenNotebook,
}: BookshelfSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [focusedNotebookId, setFocusedNotebookId] = useState<string | null>(
    null,
  );
  const [opening, setOpening] = useState<Opening | null>(null);
  const windowWidth = useSyncExternalStore(
    subscribeToResize,
    () => window.innerWidth,
  );
  const windowHeight = useSyncExternalStore(
    subscribeToResize,
    () => window.innerHeight,
  );

  // every row is as big on screen as a one-row shelf would be
  const pixelsPerUnit =
    (windowHeight * ROW_HEIGHT_SHARE) / ONE_ROW_SHELF_HEIGHT;
  const shelfPixelWidth = windowWidth * SHELF_WIDTH_SHARE;
  const layout = getShelfLayout(
    shelfPixelWidth / pixelsPerUnit,
    notebooks.length,
  );

  // the page can't scroll under the opening
  useEffect(() => {
    if (!opening) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [opening]);

  // Starts opening a notebook, once, and goes to it when the opening is done
  function chooseNotebook(notebookId: string) {
    const container = containerRef.current;
    if (opening || !container) return;
    setOpening({
      notebookId,
      shelfRect: container.getBoundingClientRect(),
      flightStartedAt: null,
    });

    // it slides out, then flies down to the table, then the notebook opens
    setTimeout(() => {
      setOpening((current) =>
        current && { ...current, flightStartedAt: performance.now() },
      );
    }, OPEN_SLIDE_MS);
    setTimeout(() => onOpenNotebook(notebookId), OPEN_SLIDE_MS + OPEN_FLIGHT_MS);
  }

  // A plain click or Enter plays the opening. Holding a key to open it in a
  // new tab or window opens it normally, since this page stays
  function handleLinkClick(event: MouseEvent, notebookId: string) {
    const isPlainClick =
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey;
    if (!isPlainClick) return;
    event.preventDefault();
    chooseNotebook(notebookId);
  }

  return (
    <div
      ref={containerRef}
      className="bookshelf-scene"
      data-ready={isReady}
      data-opening={opening !== null}
      style={
        {
          "--scene-width": `${shelfPixelWidth + 2 * WALL_MARGIN_X}px`,
          "--scene-height": `${
            layout.height * pixelsPerUnit + 2 * WALL_MARGIN_Y
          }px`,
        } as React.CSSProperties
      }
    >
      {/* flat keeps the real colors, and demand draws only when something
          changes, like the carousel. Variance shadows blur smoothly at their
          edges, without the grain of other soft shadows */}
      <Canvas
        flat
        shadows="variance"
        frameloop="demand"
        dpr={[1, 2]}
        resize={{ debounce: 0 }}
        onCreated={() => setIsReady(true)}
      >
        <ambientLight intensity={AMBIENT_LIGHT_STRENGTH} />
        <Bookshelf
          notebooks={notebooks}
          layout={layout}
          focusedNotebookId={focusedNotebookId}
          opening={opening}
          onChooseNotebook={chooseNotebook}
        />
      </Canvas>

      {/* the 3D notebooks are what's seen and clicked, these links are for
          the keyboard and screen readers, in the same order as the shelf */}
      {notebooks.map((notebook) => (
        <Link
          key={notebook.id}
          href={`/userNotebooks/${notebook.id}`}
          className="visually-hidden"
          onClick={(event) => handleLinkClick(event, notebook.id)}
          onFocus={() => setFocusedNotebookId(notebook.id)}
          onBlur={() =>
            setFocusedNotebookId((current) =>
              current === notebook.id ? null : current,
            )
          }
        >
          {notebook.title}
        </Link>
      ))}
    </div>
  );
}
