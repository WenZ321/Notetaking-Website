import type { JSONContent } from "@tiptap/core";

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
            style={{
              color: mark.attrs?.color,
              fontSize: mark.attrs?.fontSize,
              fontFamily: mark.attrs?.fontFamily,
            }}
          >
            {rendered}
          </span>
        );
        break;
      case "highlight":
        rendered = (
          // color: inherit overrides the browser's default `mark { color: black }`
          <mark
            style={{ backgroundColor: mark.attrs?.color, color: "inherit" }}
          >
            {rendered}
          </mark>
        );
        break;
    }
  }

  return <>{rendered}</>;
}
