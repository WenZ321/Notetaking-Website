import type { Attributes, CommandProps } from "@tiptap/core";
import type { ReactNodeViewProps } from "@tiptap/react";
import type { ComponentType } from "react";
import type { TextFormatState, ToolbarField } from "@/types/TextFormatting";
import type { NotebookPaperType } from "@/types/Notebook";
import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { snapBlockSizeToPaper } from "@/components/NotebookPaperTypes/PaperLogic/SnapBlockSizeToPaper";
import { insertIntoWrappedBlock } from "@/tiptap/extensions/WrappedBlocks/InsertIntoWrappedBlock";

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

// Widest and tallest a block can be, set by each block
export type MaxBlockSize = {
  maxWidth: number;
  maxHeight: number;
};

// What an insert command can be given: toolbar values to use instead of
// the defaults
export type InsertNodeOptions<TField extends ToolbarField = never> = {
  toolbarValues?: Partial<Pick<TextFormatState, TField>>;
};

// Blocks also need the page's paper so their size can fit it
export type InsertBlockOptions<TField extends ToolbarField = never> =
  InsertNodeOptions<TField> & { paperType: NotebookPaperType };

// A node's starting attrs, with a starting value for every toolbar field
type NodeDefaultAttrs<
  TAttrs extends Attrs,
  TField extends ToolbarField,
> = TAttrs & Pick<TextFormatState, TField>;

// Blocks need a width so WrappedBlock can tell if they fit side by side,
// a height, and a max size to resize up to
type BlockNodeOptions<TAttrs extends Attrs, TField extends ToolbarField> = {
  group: "block";
  defaultAttrs: NodeDefaultAttrs<TAttrs, TField> & {
    width: number;
    height: number;
  };
  maxSize: MaxBlockSize;
};

// Inline nodes flow with the text, so they're never resized
type InlineNodeOptions<TAttrs extends Attrs, TField extends ToolbarField> = {
  group: "inline";
  defaultAttrs: NodeDefaultAttrs<TAttrs, TField>;
};

// The options that depend on whether the node is a block or inline
type NodeGroupOptions<TAttrs extends Attrs, TField extends ToolbarField> =
  BlockNodeOptions<TAttrs, TField> | InlineNodeOptions<TAttrs, TField>;

// Options needed to define one custom node type
type CreateReactBlockOptions<
  TAttrs extends Attrs,
  TField extends ToolbarField,
> = {
  name: string; // node type name, e.g. "DiagramBlock"
  dataType: string; // used as the "data-type" HTML attribute
  component: ComponentType<ReactNodeViewProps>; // React component rendering this node
  draggable: boolean;
  // the toolbar settings this node has; the toolbar disables the rest while the node is selected
  toolbarFields: readonly TField[];
} & NodeGroupOptions<TAttrs, TField>;

// Builds a tiptap node extension from a small set of options
export function CreateReactNodeExtension<
  TAttrs extends Attrs,
  TField extends ToolbarField = never,
>(options: CreateReactBlockOptions<TAttrs, TField>) {
  const {
    name,
    dataType,
    defaultAttrs,
    component,
    group,
    draggable,
    toolbarFields,
  } = options;
  const maxSize = options.group === "block" ? options.maxSize : null;

  // an inline node has to render as a <span>
  const tag = group === "inline" ? "span" : "div";

  return Node.create({
    name,
    // Extra settings, available elsewhere as this.options
    addOptions() {
      return {
        defaultAttrs,
        maxSize,
        toolbarFields,
      };
    },
    // block nodes also join wrappableBlock, so WrappedBlock puts them in rows
    group: group === "block" ? "block wrappableBlock" : "inline",
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

    // Matches <div data-type="..."> (or <span ...> for inline nodes) elements as this node when parsing HTML
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
        // Inserts a new instance of this node with its default attributes.
        // Any toolbar values passed in are used instead of the defaults.
        // Only blocks have a size, which is fit to the page's paper. A block
        // inserted beside a row joins that row instead of starting its own
        [`insert${name}`]:
          options.group === "block"
            ? ({ toolbarValues, paperType }: InsertBlockOptions<TField>) =>
                (props: CommandProps) => {
                  const attrs = snapBlockSizeToPaper(
                    { ...options.defaultAttrs, ...toolbarValues },
                    paperType,
                    options.maxSize,
                  );
                  const block = props.editor.schema.nodes[name].create(attrs);
                  return (
                    insertIntoWrappedBlock(props, block, paperType) ||
                    props.commands.insertContent({ type: name, attrs })
                  );
                }
            : ({ toolbarValues }: InsertNodeOptions<TField> = {}) =>
                ({ commands }: CommandProps) =>
                  commands.insertContent({
                    type: name,
                    attrs: { ...defaultAttrs, ...toolbarValues },
                  }),
      };
    },

    // Renders via the given React component instead of default DOM output.
    // Only applies inside a live editor, not generateHTML/parseHTML above.
    addNodeView() {
      return ReactNodeViewRenderer(component);
    },
  });
}
