import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { WrappedBlockFlowMarker } from "./wrappedBlockFlowMarker";
import { WRAPPED_BLOCK_FLOW_ATTR } from "./wrappedBlockFlowMarker";

/**
 * A copy of a line with its flow marker set or cleared. Anything that isn't
 * a line of text is left as is
 * @param line The line
 * @param marker The marker it gets
 * @returns The marked line
 */
export function withFlowMarker(
  line: ProseMirrorNode,
  marker: WrappedBlockFlowMarker,
): ProseMirrorNode {
  if (!line.isTextblock || line.attrs[WRAPPED_BLOCK_FLOW_ATTR] === marker)
    return line;
  return line.type.create(
    { ...line.attrs, [WRAPPED_BLOCK_FLOW_ATTR]: marker },
    line.content,
    line.marks,
  );
}
