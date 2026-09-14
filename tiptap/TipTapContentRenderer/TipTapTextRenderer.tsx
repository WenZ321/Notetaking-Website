import type { JSONContent } from "@tiptap/core";

// Marks wrap inside-out: earlier entries end up nested inside later ones.
// "textStyle" (font-size) must be last/outermost, or a highlight painted
// inside it won't stretch to cover the larger font.
const MARK_RENDER_ORDER = ["highlight", "bold", "italic", "underline", "textStyle"];

export function TipTapTextRenderer({ node }: { node: JSONContent }) {
  let rendered: React.ReactNode = node.text;

  const marksByType = new Map((node.marks ?? []).map((mark) => [mark.type, mark]));

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
          <mark style={{ backgroundColor: mark.attrs?.color, color: "inherit" }}>
            {rendered}
          </mark>
        );
        break;
    }
  }

  return <>{rendered}</>;
}
