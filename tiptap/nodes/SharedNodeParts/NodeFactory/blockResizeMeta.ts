// Transaction meta sent when a block resize starts and ends, so other
// extensions can wait for the final size instead of reacting to every step
export const BLOCK_RESIZE_META = "blockResize";

export type BlockResizeMeta = "start" | "end";
