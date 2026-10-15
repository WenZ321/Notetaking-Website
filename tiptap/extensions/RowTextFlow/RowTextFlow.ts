import { Extension } from "@tiptap/core";
import { ROW_FLOW_ATTR } from "./rowFlowMarker";
import { createRowTextFlowPlugin } from "./rowTextFlowPlugin";

// Keeps text beside blocks inside its row while typing. Lines that don't
// fit are pushed down and marked, and only marked lines flow back up
export const RowTextFlow = Extension.create({
  name: "rowTextFlow",

  // The marker lives on paragraphs and is saved with the page. Pressing
  // Enter in pushed text makes the new half the user's own paragraph
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph"],
        attributes: {
          [ROW_FLOW_ATTR]: {
            default: null,
            keepOnSplit: false,
            parseHTML: (element) => element.getAttribute("data-row-overflow"),
            renderHTML: (attributes) =>
              attributes[ROW_FLOW_ATTR]
                ? { "data-row-overflow": attributes[ROW_FLOW_ATTR] }
                : {},
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    return [createRowTextFlowPlugin()];
  },
});
