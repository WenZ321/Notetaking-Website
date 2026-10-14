import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";
import { blockDragPluginKey } from "../dragState";

/**
 * The page as it should be saved. While a drop is previewed, that's the page
 * from before the preview, since the preview isn't a real edit
 * @param state The editor state
 * @returns The page to save
 */
export function getSavableDoc(state: EditorState): ProseMirrorNode {
  return blockDragPluginKey.getState(state)?.preview?.baseDoc ?? state.doc;
}
