// The paragraph attribute that marks text typing pushed out of a row's
// text, so only that text can flow back. "continues" means the paragraph
// was cut from the line before it and joins it again when it flows back.
// "whole" means a whole paragraph was pushed and comes back as its own
export const ROW_FLOW_ATTR = "rowOverflow";

export type RowFlowMarker = "continues" | "whole" | null;

// Put on the changes this extension makes, so it doesn't react to its own
export const ROW_FLOW_META = "rowTextFlow";
