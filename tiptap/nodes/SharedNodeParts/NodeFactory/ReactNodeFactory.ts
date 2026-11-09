import type { Attributes, CommandProps, Editor } from "@tiptap/core";
import type { ReactNodeViewProps } from "@tiptap/react";
import type { ComponentType } from "react";
import type { TextFormatState, ToolbarField } from "@/types/TextFormatting";
import type { NotebookPaperType } from "@/types/Notebook";
import type { CustomBlockNode } from "@/tiptap/nodes/WrappedNodeTypes";
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { snapBlockSizeToPaper } from "@/components/NotebookPaperTypes/PaperLogic/SnapBlockSizeToPaper";
import { insertIntoWrappedBlock } from "@/tiptap/extensions/WrappedBlocks/InsertIntoWrappedBlock";

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

/**
 * The attrs a new block starts with: its defaults with any toolbar values
 * passed in, sized to fit the page's paper
 * @param defaultAttrs The block's default attrs
 * @param maxSize The biggest the block can be
 * @param paperType The page's paper
 * @param toolbarValues Toolbar values to use instead of the defaults
 */
function getStartingBlockAttrs<
  TAttrs extends { width: number; height: number },
>(
  defaultAttrs: TAttrs,
  maxSize: MaxBlockSize,
  paperType: NotebookPaperType,
  toolbarValues?: Attrs,
): TAttrs {
  return snapBlockSizeToPaper(
    { ...defaultAttrs, ...toolbarValues },
    paperType,
    maxSize,
  );
}

/**
 * A new block of this type, the same as a click on its insert button makes,
 * for dragging onto the page
 * @param editor The editor holding the block's extension
 * @param name The block's node type name, e.g. "DiagramBlock"
 * @param paperType The page's paper
 */
export function createStartingBlock(
  editor: Editor,
  name: string,
  paperType: NotebookPaperType,
): CustomBlockNode {
  const extension = editor.extensionManager.extensions.find(
    (ext) => ext.name === name,
  );
  // only blocks have a max size, inline nodes have null
  const blockOptions = extension?.options as
    | {
        defaultAttrs: { width: number; height: number };
        maxSize: MaxBlockSize | null;
      }
    | undefined;
  if (!blockOptions?.maxSize) throw new Error(`${name} isn't a custom block`);

  const attrs = getStartingBlockAttrs(
    blockOptions.defaultAttrs,
    blockOptions.maxSize,
    paperType,
  );
  return editor.schema.nodes[name].create(attrs) as CustomBlockNode;
}

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
                  const attrs = getStartingBlockAttrs(
                    options.defaultAttrs,
                    options.maxSize,
                    paperType,
                    toolbarValues,
                  );
                  // a selected block isn't replaced, the new one starts its
                  // own row right below the selected one's row
                  const { selection } = props.tr;
                  if (selection instanceof NodeSelection) {
                    const { $from } = selection;
                    const belowRow =
                      $from.depth === 0 ? selection.to : $from.after(1);
                    return props.commands.insertContentAt(belowRow, {
                      type: name,
                      attrs,
                    });
                  }

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
