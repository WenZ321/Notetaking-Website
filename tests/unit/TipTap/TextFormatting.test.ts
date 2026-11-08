import type { Editor } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import type { ToolbarFormatState } from "@/types/TextFormatting";
import { describe, expect, test, vi } from "vitest";
import { Node, getSchema } from "@tiptap/core";
import { EditorState, NodeSelection } from "@tiptap/pm/state";
import {
  readFormatFromEditor,
  updateEditorTextFormatting,
} from "@/tiptap/TipTapUtils";
import {
  DefaultTextFormatState,
  EmptyToolbarFormatState,
} from "@/constants/TextFormattingConstants";
import { Paragraph } from "@/tiptap/nodes/Paragraph/Paragraph";

// A page with a block that keeps a text color and a font size on itself,
// like the math block, and one with no toolbar settings, like the diagram
const Page = Node.create({ name: "doc", topNode: true, content: "block+" });
const Text = Node.create({ name: "text", group: "inline" });
const ColorBlock = Node.create({
  name: "ColorBlock",
  group: "block",
  atom: true,
  addAttributes() {
    return { textColor: { default: "#ff0000" }, fontSize: { default: 14 } };
  },
});
const PlainBlock = Node.create({ name: "PlainBlock", group: "block", atom: true });
const schema = getSchema([Page, Text, Paragraph, ColorBlock, PlainBlock]);

// Which toolbar settings each block lists
const EXTENSIONS = [
  { name: "ColorBlock", options: { toolbarFields: ["textColor", "fontSize"] } },
  { name: "PlainBlock", options: {} },
];

// A stand-in for the editor with a block selected, which records its changes
function makeBlockEditor(blockName: "ColorBlock" | "PlainBlock") {
  const doc = schema.nodes.doc.create(null, schema.nodes[blockName].create());
  const view = {
    state: EditorState.create({
      doc,
      selection: NodeSelection.create(doc, 0),
    }),
    dispatch: vi.fn((tr: Transaction) => {
      view.state = view.state.apply(tr);
    }),
  };
  return {
    view,
    get state() {
      return view.state;
    },
    extensionManager: { extensions: EXTENSIONS },
  };
}

// A stand-in for the editor with text selected, which has these marks on
// it, and which records the commands it's given
function makeTextEditor(
  active: string[],
  textStyle: Record<string, string>,
  highlight: Record<string, string> = {},
) {
  const doc = schema.nodes.doc.create(
    null,
    schema.nodes.paragraph.create(null, schema.text("abc")),
  );
  return {
    state: EditorState.create({ doc }),
    isActive: (name: string) => active.includes(name),
    getAttributes: (name: string) =>
      name === "textStyle" ? textStyle : highlight,
    commands: {
      toggleBold: vi.fn(),
      toggleItalic: vi.fn(),
      toggleUnderline: vi.fn(),
      setFontFamily: vi.fn(),
      setFontSize: vi.fn(),
      setColor: vi.fn(),
      setHighlight: vi.fn(),
      unsetHighlight: vi.fn(),
    },
  };
}

// What the toolbar shows for text that has exactly these styles
const STYLED_TEXT = {
  fontFamily: "Georgia",
  fontSize: "18px",
  color: "#333333",
};
const STYLED_FORMAT: ToolbarFormatState = {
  isBold: true,
  isItalic: false,
  isUnderline: false,
  fontFamily: "Georgia",
  fontSize: 18,
  textColor: "#333333",
  highlightColor: "",
};

describe("readFormatFromEditor", () => {
  test("selected text shows its marks and styles, with the size as a number", () => {
    const editor = makeTextEditor(["bold"], STYLED_TEXT);

    expect(readFormatFromEditor(editor as unknown as Editor)).toEqual(
      STYLED_FORMAT,
    );
  });

  test("text with no styles shows the defaults", () => {
    const editor = makeTextEditor([], {});

    expect(readFormatFromEditor(editor as unknown as Editor)).toEqual(
      DefaultTextFormatState,
    );
  });

  test("a selected block shows only the settings it has, the rest are off", () => {
    const editor = makeBlockEditor("ColorBlock");

    expect(readFormatFromEditor(editor as unknown as Editor)).toEqual({
      ...EmptyToolbarFormatState,
      textColor: "#ff0000",
      fontSize: 14,
    });
  });

  test("a selected block with no settings turns the whole toolbar off", () => {
    const editor = makeBlockEditor("PlainBlock");

    expect(readFormatFromEditor(editor as unknown as Editor)).toEqual(
      EmptyToolbarFormatState,
    );
  });
});

describe("updateEditorTextFormatting on text", () => {
  test("only the settings that differ from the text are changed", () => {
    const editor = makeTextEditor([], STYLED_TEXT);

    updateEditorTextFormatting(editor as unknown as Editor, STYLED_FORMAT);

    expect(editor.commands.toggleBold).toHaveBeenCalledOnce();
    expect(editor.commands.toggleItalic).not.toHaveBeenCalled();
    expect(editor.commands.setFontFamily).not.toHaveBeenCalled();
    expect(editor.commands.setFontSize).not.toHaveBeenCalled();
    expect(editor.commands.setColor).not.toHaveBeenCalled();
  });

  test("a new size is written with its unit", () => {
    const editor = makeTextEditor(["bold"], STYLED_TEXT);

    updateEditorTextFormatting(editor as unknown as Editor, {
      ...STYLED_FORMAT,
      fontSize: 24,
    });

    expect(editor.commands.setFontSize).toHaveBeenCalledWith("24px");
  });

  test("a toolbar still catching up with the selection writes nothing", () => {
    const editor = makeTextEditor([], {});

    updateEditorTextFormatting(editor as unknown as Editor, {
      ...STYLED_FORMAT,
      textColor: null,
    });

    Object.values(editor.commands).forEach((command) =>
      expect(command).not.toHaveBeenCalled(),
    );
  });

  test("a highlight is set to the new color, and taken off when cleared", () => {
    const plain = makeTextEditor(["bold"], STYLED_TEXT);
    updateEditorTextFormatting(plain as unknown as Editor, {
      ...STYLED_FORMAT,
      highlightColor: "#ffff00",
    });
    expect(plain.commands.setHighlight).toHaveBeenCalledWith({
      color: "#ffff00",
    });

    const highlighted = makeTextEditor(["bold"], STYLED_TEXT, {
      color: "#ffff00",
    });
    updateEditorTextFormatting(highlighted as unknown as Editor, STYLED_FORMAT);
    expect(highlighted.commands.unsetHighlight).toHaveBeenCalledOnce();
  });
});

describe("updateEditorTextFormatting on a selected block", () => {
  test("writes only the block's own settings that changed, as one change", () => {
    const editor = makeBlockEditor("ColorBlock");

    updateEditorTextFormatting(editor as unknown as Editor, {
      ...EmptyToolbarFormatState,
      textColor: "#0000ff",
      fontSize: 14,
      isBold: true,
    });

    expect(editor.view.dispatch).toHaveBeenCalledOnce();
    expect(editor.state.doc.firstChild?.attrs).toEqual({
      textColor: "#0000ff",
      fontSize: 14,
    });
  });

  test("nothing changed means nothing is written", () => {
    const editor = makeBlockEditor("ColorBlock");

    updateEditorTextFormatting(editor as unknown as Editor, {
      ...EmptyToolbarFormatState,
      textColor: "#ff0000",
      fontSize: 14,
    });

    expect(editor.view.dispatch).not.toHaveBeenCalled();
  });
});
