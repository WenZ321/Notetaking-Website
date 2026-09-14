import type { JSONContent } from "@tiptap/core";
import { TipTapNodeRenderer } from "./TipTapNodeRenderer";

type TipTapContentRendererProps = {
  content: JSONContent;
};

export function TipTapContentRenderer({ content }: TipTapContentRendererProps) {
  return (
    <>
      {content.content?.map((node, index) => (
        <TipTapNodeRenderer key={index} node={node} />
      ))}
    </>
  );
}
