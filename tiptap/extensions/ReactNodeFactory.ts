import { Node } from "@tiptap/core";
import type { CommandProps } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import type { ComponentType } from "react";

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

// Default attributes of this specific tiptap node
type Attrs = Record<string, unknown>;

type CreateReactBlockOptions<TAttrs extends Attrs> = {
  name: string;
  dataType: string;
  defaultAttrs: TAttrs;
  component: ComponentType<ReactNodeViewProps>;
  group?: "block" | "inline";
  draggable?: boolean;
  selectable?: boolean;
  atom?: boolean;
};

// Creates a tiptap node that renders with a react component created by BlockFactory
export function CreateReactNodeExtension<TAttrs extends Attrs>({
  name,
  dataType,
  defaultAttrs,
  component,
  group = "block",
  draggable = true,
  selectable = true,
  atom = true,
}: CreateReactBlockOptions<TAttrs>) {
  return Node.create({
    name,
    // Extra settings of this node
    addOptions() {
      return {
        defaultAttrs,
        maxWidth: 700,
        maxHeight: 600,
      };
    },
    group: group,
    atom,
    draggable,
    selectable,

    // Adds the given attributes
    addAttributes() {
      const attrs: Record<string, any> = {};

      Object.entries(this.options.defaultAttrs).forEach(([key, value]) => {
        const dataAttr = `data-${key}`;

        attrs[key] = {
          default: value,

          parseHTML: (element: HTMLElement) => {
            const attrValue = element.getAttribute(dataAttr);

            if (attrValue === null) {
              return value;
            }

            if (Array.isArray(value) || typeof value === "object") {
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

    parseHTML() {
      return [
        {
          tag: `div[data-type="${dataType}"]`,
        },
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(HTMLAttributes, {
          "data-type": dataType,
        }),
      ];
    },

    addCommands() {
      return {
        // Inserts a new instance of this node at the current selection,
        // seeded with its default attributes
        [`insert${name}`]:
          () =>
          ({ commands }: CommandProps) => {
            return commands.insertContent({
              type: name,
              attrs: defaultAttrs,
            });
          },

        // Deletes the current selection, used to remove this node
        [`delete${name}`]:
          () =>
          ({ commands }: CommandProps) => {
            return commands.deleteSelection();
          },
      };
    },

    // Renders this node in the editor using the given react component
    // instead of tiptap's default DOM rendering
    addNodeView() {
      return ReactNodeViewRenderer(component);
    },
  });
}
