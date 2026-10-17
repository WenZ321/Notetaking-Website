import { Extension } from "@tiptap/core";
import { WRAPPED_BLOCK_FLOW_ATTR } from "./wrappedBlockFlowMarker";
import { createWrappedBlockTextFlowPlugin } from "./wrappedBlockTextFlowPlugin";

// Keeps text beside blocks inside its wrapped block while typing. Lines that don't
// fit are pushed down and marked, and only marked lines flow back up
export const WrappedBlockTextFlow = Extension.create({
  name: "rowTextFlow",

  // The marker lives on paragraphs and is saved with the page. Pressing
  // Enter in pushed text makes the new half the user's own paragraph
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph"],
        attributes: {
          [WRAPPED_BLOCK_FLOW_ATTR]: {
            default: null,
            keepOnSplit: false,
            parseHTML: (element) => element.getAttribute("data-row-overflow"),
            renderHTML: (attributes) =>
              attributes[WRAPPED_BLOCK_FLOW_ATTR]
                ? { "data-row-overflow": attributes[WRAPPED_BLOCK_FLOW_ATTR] }
                : {},
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    return [createWrappedBlockTextFlowPlugin()];
  },
});
