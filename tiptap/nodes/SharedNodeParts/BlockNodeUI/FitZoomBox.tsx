import type { ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";
import "./FitZoomBox.css";

// Smallest the content is scaled down before the box stops shrinking
const MIN_ZOOM = 0.5;

type FitZoomBoxProps = {
  width: number;
  height: number;
  fontSize: number;
  textColor: string;
  chunkSelector: string; // matches the pieces of the content that can't be split across lines
  children: ReactNode;
  reportMinWidth?: (minWidth: number) => void;
  reportMinHeight?: (minHeight: number) => void;
};

// A resizable block's sized box with its content centered. The content wraps
// first; once its widest chunk still doesn't fit, it zooms out, down to MIN_ZOOM.
// It can't be resized shorter than its content
export function FitZoomBox({
  width,
  height,
  fontSize,
  textColor,
  chunkSelector,
  children,
  reportMinWidth,
  reportMinHeight,
}: FitZoomBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1);

  // Re-measures after every render, since any prop change can resize the content
  useLayoutEffect(() => {
    const box = boxRef.current;
    const content = contentRef.current;
    if (!box || !content) return;

    let isActive = true;

    const fitToBox = () => {
      if (!isActive) return;

      const chunks = box.querySelectorAll<HTMLElement>(chunkSelector);

      // rects include any page scaling above the box, so it's divided back out
      const ancestorScale = box.getBoundingClientRect().width / box.offsetWidth;

      let widestChunk = 0;
      chunks.forEach((chunk) => {
        widestChunk = Math.max(
          widestChunk,
          chunk.getBoundingClientRect().width,
        );
      });

      const naturalChunkWidth = widestChunk / ancestorScale / zoomRef.current;
      if (naturalChunkWidth === 0) return;

      const boxStyle = getComputedStyle(box);
      const padding =
        parseFloat(boxStyle.paddingLeft) + parseFloat(boxStyle.paddingRight);
      const availableWidth = box.clientWidth - padding;

      const zoom = Math.min(
        1,
        Math.max(MIN_ZOOM, availableWidth / naturalChunkWidth),
      );
      const minWidth = Math.ceil(naturalChunkWidth * MIN_ZOOM + padding);

      zoomRef.current = zoom;
      box.style.setProperty("--fit-zoom", String(zoom));
      box.style.setProperty("--fit-min-width", `${minWidth}px`);
      reportMinWidth?.(minWidth);

      // measured after the new zoom is set, since zooming changes the height
      const contentHeight =
        content.getBoundingClientRect().height / ancestorScale;

      // shortest is the content plus the box's own padding, so nothing is cut off
      const verticalPadding =
        parseFloat(boxStyle.paddingTop) + parseFloat(boxStyle.paddingBottom);
      const minHeight = Math.ceil(contentHeight + verticalPadding);
      reportMinHeight?.(minHeight);
    };

    fitToBox();

    // fonts can finish loading after the first render and change the widths
    document.fonts.ready.then(fitToBox);

    return () => {
      isActive = false;
    };
  });

  return (
    <div
      ref={boxRef}
      className="fit-zoom-box"
      style={
        {
          "--fit-width": `${width}px`,
          "--fit-height": `${height}px`,
          "--fit-font-size": `${fontSize}px`,
          "--fit-text-color": textColor,
        } as React.CSSProperties
      }
    >
      <div ref={contentRef} className="fit-zoom-box-content">
        {children}
      </div>
    </div>
  );
}
