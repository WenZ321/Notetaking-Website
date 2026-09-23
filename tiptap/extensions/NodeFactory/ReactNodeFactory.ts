import type { Attributes, CommandProps } from "@tiptap/core";
import type { ReactNodeViewProps } from "@tiptap/react";
import type { ComponentType } from "react";
import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

// Merges attribute objects together; later ones win on conflicts
function mergeAttributes(
  ...objects: Array<Record<string, unknown> | undefined>
) {
  return objects.reduce<Record<string, unknown>>((result, attrs) => {
    if (!attrs) {
      return result;
    }

    return { ...result, ...attrs };
  }, {});
}

// Generic bag of attrs for a node
type Attrs = Record<string, unknown>;

// Options needed to define one custom node type
type CreateReactBlockOptions<TAttrs extends Attrs> = {
  name: string; // node type name, e.g. "DiagramBlock"
  dataType: string; // used as the "data-type" HTML attribute
  defaultAttrs: TAttrs; // starting values + defines which attrs exist
  component: ComponentType<ReactNodeViewProps>; // React component rendering this node
  group: "block" | "inline";
  draggable: boolean;
};

// Builds a tiptap node extension from a small set of options
export function CreateReactNodeExtension<TAttrs extends Attrs>({
  name,
  dataType,
  defaultAttrs,
  component,
  group,
  draggable,
}: CreateReactBlockOptions<TAttrs>) {
  // an inline node has to render as a <span> - a <div> would break the
  // surrounding line, which is the one thing "inline" is about
  const tag = group === "inline" ? "span" : "div";

  return Node.create({
    name,

    // Extra settings, available elsewhere as this.options
    addOptions() {
      return {
        defaultAttrs,
        maxWidth: 700,
        maxHeight: 600,
      };
    },
    group: group,
    inline: group === "inline",
    // every custom node is read as a single item by the HTML converter
    atom: true,
    draggable,

    // Turns each default attr into a tiptap attribute backed by one data-* HTML attribute
    addAttributes() {
      const attrs: Attributes = {};

      Object.entries(this.options.defaultAttrs).forEach(([key, value]) => {
        const dataAttr = `data-${key}`;

        attrs[key] = {
          default: value,

          // Reads this attr's value off a matched DOM element
          parseHTML: (element: HTMLElement) => {
            const attrValue = element.getAttribute(dataAttr);

            if (attrValue === null) {
              return value;
            }

            if (Array.isArray(value) || typeof value === "object") {
              // objects/arrays are stored as JSON text
              try {
                return JSON.parse(attrValue);
              } catch {
                return value;
              }
            }

            if (typeof value === "number") {
              return Number(attrValue);
            }

            if (typeof value === "boolean") {
              return attrValue === "true";
            }

            return attrValue;
          },

          // Writes this attr's value back out as a data-* attribute
          renderHTML: (attrs: Record<string, unknown>) => {
            const attrValue = attrs[key];

            if (attrValue === undefined || attrValue === null) {
              return {};
            }

            if (Array.isArray(attrValue) || typeof attrValue === "object") {
              return {
                [dataAttr]: JSON.stringify(attrValue),
              };
            }

            return {
              [dataAttr]: String(attrValue),
            };
          },
        };
      });

      return attrs;
    },

    // Matches <div data-type="..."> (or <span ...> for inline nodes)
    // elements as this node when parsing HTML
    parseHTML() {
      return [
        {
          tag: `${tag}[data-type="${dataType}"]`,
        },
      ];
    },

    // Serializes this node back to its tag, tagged with data-type
    renderHTML({ HTMLAttributes }) {
      return [
        tag,
        mergeAttributes(HTMLAttributes, {
          "data-type": dataType,
        }),
      ];
    },

    addCommands() {
      return {
        // Inserts a new instance of this node with its default attributes
        [`insert${name}`]:
          () =>
          ({ commands }: CommandProps) => {
            return commands.insertContent({
              type: name,
              attrs: defaultAttrs,
            });
          },

        // Deletes the current selection
        [`delete${name}`]:
          () =>
          ({ commands }: CommandProps) => {
            return commands.deleteSelection();
          },
      };
    },

    // Renders via the given React component instead of default DOM output.
    // Only applies inside a live editor, not generateHTML/parseHTML above.
    addNodeView() {
      return ReactNodeViewRenderer(component);
    },
  });
}
