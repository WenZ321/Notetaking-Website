import type { JSONContent } from "@tiptap/core";
import type { MatrixBlockAttrs } from "@/tiptap/extensions/Matrix/MatrixBlockType";
import { MatrixBlockGrid } from "@/tiptap/extensions/Matrix/MatrixBlockGrid";

// Read-only KaTeX render of a matrix block, straight from its saved attrs
export function TipTapMatrixBlockRenderer({ node }: { node: JSONContent }) {
  return <MatrixBlockGrid attrs={node.attrs as MatrixBlockAttrs} />;
}
