import type { EditorState } from "@tiptap/pm/state";

// The undo history plugin's name. Undo itself restores the history by
// putting its saved state on a change under this name
export const HISTORY_KEY = "history$";

/**
 * Reads the undo history as it is now, so it can be put back later
 * @param state The editor state
 * @returns The saved history, or undefined when there's no undo
 */
export function readHistoryState(state: EditorState): unknown {
  return state.plugins
    .find((plugin) => (plugin as unknown as { key: string }).key === HISTORY_KEY)
    ?.getState(state);
}
