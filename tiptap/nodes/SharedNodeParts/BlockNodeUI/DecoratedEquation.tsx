import type { ReactNode } from "react";
import { useRef } from "react";
import { useEquationRows } from "./useEquationRows";
import "./DecoratedEquation.css";

type DecoratedEquationProps = {
  // matches the pieces a row is made of, an equation wraps between them
  pieceSelector: string;
  isUnderline: boolean;
  // an empty string means no highlight
  highlightColor: string;
  className: string;
  children: ReactNode;
};

// Wraps an equation that can wrap onto several rows, and draws a highlight
// behind and an underline under each row
export function DecoratedEquation({
  pieceSelector,
  isUnderline,
  highlightColor,
  className,
  children,
}: DecoratedEquationProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const hasHighlight = highlightColor !== "";
  const rows = useEquationRows(
    wrapperRef,
    pieceSelector,
    isUnderline || hasHighlight,
  );

  return (
    <span
      ref={wrapperRef}
      className={`decorated-equation ${className}`}
      style={
        {
          "--row-highlight-color": highlightColor,
        } as React.CSSProperties
      }
    >
      {children}
      {rows.map((row, index) => (
        // each row's box, read by its highlight and underline
        <span
          key={index}
          style={
            {
              "--row-left": `${row.left}px`,
              "--row-top": `${row.top}px`,
              "--row-bottom": `${row.bottom}px`,
              "--row-width": `${row.width}px`,
            } as React.CSSProperties
          }
        >
          {hasHighlight && <span className="decorated-equation-highlight" />}
          {isUnderline && <span className="decorated-equation-underline" />}
        </span>
      ))}
    </span>
  );
}
