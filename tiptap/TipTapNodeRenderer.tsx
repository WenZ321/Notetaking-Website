import type { JSONContent } from "@tiptap/core";

type TipTapNodeRendererProps = {
  node: JSONContent;
};

export function TipTapNodeRenderer({ node }: TipTapNodeRendererProps) {
  switch (node.type) {
    case "paragraph":
      return <p>{renderInlineContent(node.content)}</p>;

    default:
      return null;
  }
}

// Renders a node's inline text children (with their marks applied)
function renderInlineContent(content: JSONContent[] | undefined) {
  return content?.map((child, index) => (
    <TipTapTextRenderer key={index} node={child} />
  ));
}

function TipTapTextRenderer({ node }: { node: JSONContent }) {
  let rendered: React.ReactNode = node.text;

  for (const mark of node.marks ?? []) {
    switch (mark.type) {
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
          <mark style={{ backgroundColor: mark.attrs?.color }}>
            {rendered}
          </mark>
        );
        break;
    }
  }

  return <>{rendered}</>;
}
