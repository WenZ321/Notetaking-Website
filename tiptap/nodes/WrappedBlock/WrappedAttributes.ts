import type { CSSProperties } from "react";

// How a wrapped block or column is drawn on the page, shared by the editor and the notebook view so both always draw them the same way
export type DrawnAttributes = {
  className: string;
  dataAttributes: Record<string, string | number>; // data-* attributes the CSS and parsing read
  cssVariables: Record<string, string>; // values the CSS reads, like a saved width
};

export function getWrappedBlockAttributes(
  attrs: Record<string, unknown>,
): DrawnAttributes {
  return {
    className: "wrapped-block",
    dataAttributes: {
      "data-type": "wrapped-block",
      "data-wrap": attrs.wrap as string,
    },
    cssVariables: {},
  };
}

export function getWrappedColumnAttributes(
  attrs: Record<string, unknown>,
): DrawnAttributes {
  const width = attrs.width as number | null | undefined;
  const hasWidth = typeof width === "number";

  return {
    className: "wrapped-column",
    dataAttributes: {
      "data-type": "wrapped-column",
      "data-column-type": attrs.columnType as string,
      ...(hasWidth && { "data-width": width }),
    },
    cssVariables: hasWidth ? { "--column-width": `${width}px` } : {},
  };
}

// For the editor, which draws plain HTML with a style string
export function toHTMLAttributes({
  className,
  dataAttributes,
  cssVariables,
}: DrawnAttributes) {
  const style = Object.entries(cssVariables)
    .map(([name, value]) => `${name}: ${value}`)
    .join("; ");
  return { class: className, ...dataAttributes, ...(style && { style }) };
}

// For the notebook view, which draws React elements with a style object
export function toReactProps({
  className,
  dataAttributes,
  cssVariables,
}: DrawnAttributes) {
  return {
    className,
    ...dataAttributes,
    style: cssVariables as CSSProperties,
  };
}
