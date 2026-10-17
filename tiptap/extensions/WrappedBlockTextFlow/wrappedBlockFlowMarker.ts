// The paragraph attribute that marks text typing pushed out of a wrapped block's
// text, so only that text can flow back. "continues" means the paragraph
// was cut from the line before it and joins it again when it flows back.
// "whole" means a whole paragraph was pushed and comes back as its own
export const WRAPPED_BLOCK_FLOW_ATTR = "rowOverflow";

export type WrappedBlockFlowMarker = "continues" | "whole" | null;

// Put on the changes this extension makes, so it doesn't react to its own
export const WRAPPED_BLOCK_FLOW_META = "rowTextFlow";
