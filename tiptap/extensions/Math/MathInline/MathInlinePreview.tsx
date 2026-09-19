import type { PreviewComponentProps } from "../../ReactNodeViewFactory";
import type { MathAttrs } from "../MathType";
import { InlineMath } from "react-katex";
import { TiptapNodePreview } from "../../TiptapNodeView/TiptapNodePreview";
import "katex/dist/katex.min.css";
import "./MathInlinePreview.css";

// Read-only KaTeX rendering of an inline math node, shown when not being edited.
export function MathInlinePreview({
  node,
  openEditor,
}: PreviewComponentProps<MathAttrs>) {
  return (
    <TiptapNodePreview
      openEditor={openEditor}
      className="math-inline-preview"
      tag="span"
    >
      <InlineMath math={node.attrs.latex} />
    </TiptapNodePreview>
  );
}
