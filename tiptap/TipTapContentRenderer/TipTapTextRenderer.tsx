import type { JSONContent } from "@tiptap/core";
import "./TipTapTextRenderer.css";

// Renders text formatting in this specific order, inner first. Highlight
// wraps underline so the underline draws on top of the color, and sits
// inside textStyle so the color matches the text's size
const MARK_RENDER_ORDER = [
  "bold",
  "italic",
  "underline",
  "highlight",
  "textStyle",
];

export function TipTapTextRenderer({ node }: { node: JSONContent }) {
  let rendered: React.ReactNode = node.text;

  const marksByType = new Map(
    (node.marks ?? []).map((mark) => [mark.type, mark]),
  );

  for (const type of MARK_RENDER_ORDER) {
    const mark = marksByType.get(type);
    if (!mark) continue;

    switch (type) {
      case "bold":
        rendered = <strong>{rendered}</strong>;
        break;
      case "italic":
        rendered = <em>{rendered}</em>;
        break;
      case "underline":
        rendered = <u>{rendered}</u>;
        break;
      case "textStyle":
        rendered = (
          <span
            className="rendered-text-style"
            style={
              {
                "--text-style-color": mark.attrs?.color,
                "--text-style-font-size": mark.attrs?.fontSize,
                "--text-style-font-family": mark.attrs?.fontFamily,
              } as React.CSSProperties
            }
          >
            {rendered}
          </span>
        );
        break;
      case "highlight":
        rendered = (
          <mark
            className="rendered-highlight"
            style={
              {
                "--highlight-color": mark.attrs?.color,
              } as React.CSSProperties
            }
          >
            {rendered}
          </mark>
        );
        break;
    }
  }

  return <>{rendered}</>;
}
