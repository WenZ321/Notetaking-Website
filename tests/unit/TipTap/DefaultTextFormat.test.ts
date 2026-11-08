import type { Plugin } from "@tiptap/pm/state";
import { describe, expect, test } from "vitest";
import { Node, getSchema } from "@tiptap/core";
import { Color } from "@tiptap/extension-color";
import { FontFamily, FontSize, TextStyle } from "@tiptap/extension-text-style";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { history, undo } from "@tiptap/pm/history";
import { DecorationSet } from "@tiptap/pm/view";
import { Paragraph } from "@/tiptap/nodes/Paragraph/Paragraph";
import { createDefaultTextFormatPlugin } from "@/tiptap/extensions/DefaultTextFormat/DefaultTextFormatPlugin";
import { createEmptyLineCaretPlugin } from "@/tiptap/extensions/EmptyLineCaret/EmptyLineCaretPlugin";
import { DefaultTextFormatState } from "@/constants/TextFormattingConstants";

// A page whose text can have a font, size and color, like the app's
const Page = Node.create({ name: "doc", topNode: true, content: "block+" });
const Text = Node.create({ name: "text", group: "inline" });
const schema = getSchema([
  Page,
  Text,
  Paragraph,
  TextStyle,
  FontFamily,
  FontSize,
  Color,
]);

const DEFAULT_STYLE = {
  fontFamily: DefaultTextFormatState.fontFamily,
  fontSize: `${DefaultTextFormatState.fontSize}px`,
  color: DefaultTextFormatState.textColor,
};

// A page with one line of this text, the cursor at its end
function makePage(text: string, plugins: Plugin[]) {
  const doc = schema.nodes.doc.create(
    null,
    schema.nodes.paragraph.create(null, text ? schema.text(text) : null),
  );
  return EditorState.create({
    doc,
    selection: TextSelection.create(doc, 1 + text.length),
    plugins,
  });
}

// The font, size and color the first piece of text has
function readTextStyle(state: EditorState) {
  const text = state.doc.firstChild!.firstChild!;
  return text.marks.find((mark) => mark.type.name === "textStyle")?.attrs;
}

describe("the default text format", () => {
  test("typed text with no style gets the default font, size and color", () => {
    const state = makePage("", [createDefaultTextFormatPlugin()]);

    const typed = state.apply(state.tr.insertText("hi"));

    expect(readTextStyle(typed)).toMatchObject(DEFAULT_STYLE);
  });

  test("only what's missing is filled in, the text's own style stays", () => {
    const state = makePage("", [createDefaultTextFormatPlugin()]);
    const red = schema.marks.textStyle.create({ color: "#ff0000" });

    const typed = state.apply(state.tr.insert(1, schema.text("hi", [red])));

    expect(readTextStyle(typed)).toMatchObject({
      ...DEFAULT_STYLE,
      color: "#ff0000",
    });
  });

  test("one undo takes back the typing and its default style together", () => {
    const state = makePage("", [history(), createDefaultTextFormatPlugin()]);
    let current = state.applyTransaction(state.tr.insertText("hi")).state;

    undo(current, (tr) => {
      current = current.apply(tr);
    });

    expect(current.doc.textContent).toBe("");
  });
});

// What the caret plugin puts on the cursor's empty line, if anything.
// A line's decoration keeps its HTML attributes on its type
type LineDecoration = { type: { attrs: Record<string, string> } };
function readEmptyLineAttrs(state: EditorState) {
  const plugin = createEmptyLineCaretPlugin();
  const decorations = plugin.props.decorations!.call(plugin, state) as
    | DecorationSet
    | null;
  const decoration = decorations?.find()[0] as LineDecoration | undefined;
  return decoration?.type.attrs ?? null;
}

describe("the empty line caret", () => {
  test("an empty line takes the default size and font, so the cursor matches what's typed next", () => {
    const attrs = readEmptyLineAttrs(makePage("", []))!;

    expect(attrs.class).toBe("empty-line-with-caret");
    expect(attrs.style).toContain(`--empty-line-font-size: ${DEFAULT_STYLE.fontSize}`);
    expect(attrs.style).toContain(`--empty-line-font-family: ${DEFAULT_STYLE.fontFamily}`);
  });

  test("a size chosen before typing is the size the cursor shows", () => {
    const state = makePage("", []);
    const big = schema.marks.textStyle.create({ fontSize: "24px" });
    const withStoredSize = state.apply(state.tr.setStoredMarks([big]));

    const attrs = readEmptyLineAttrs(withStoredSize)!;

    expect(attrs.style).toContain("--empty-line-font-size: 24px");
  });

  test("a line with text needs nothing", () => {
    expect(readEmptyLineAttrs(makePage("abc", []))).toBeNull();
  });
});
