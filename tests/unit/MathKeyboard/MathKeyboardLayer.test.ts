import { describe, expect, test } from "vitest";
import { buildKeyboardLayer } from "@/tiptap/nodes/Math/MathLiveKeyboard/MathLiveKeyboardUtils";
import { ONE, SPACE } from "@/tiptap/nodes/Math/MathLiveKeyboard/MathLiveKey";
import {
  ABC,
  BACKSPACE,
  MathLiveActionKey,
} from "@/tiptap/nodes/Math/MathLiveKeyboard/MathLiveActionKey";
import { buildMatrixLatex } from "@/tiptap/nodes/Matrix/MatrixBlockLatex";

describe("buildKeyboardLayer", () => {
  const layer = buildKeyboardLayer([[ONE, SPACE], [BACKSPACE, ABC]], "test");
  const [[one, space], [backspace, abc]] = layer.rows as Record<string, unknown>[][];

  test("a key types its LaTeX and shows its label", () => {
    expect(layer.id).toBe("test");
    expect(one).toMatchObject({ latex: "1", label: "1", width: 1 });
  });

  test("the space key is twice as wide", () => {
    expect(space).toMatchObject({ width: 2 });
  });

  test("action keys go on the keyboard as they are", () => {
    expect(backspace).toBe(BACKSPACE);
    expect(abc).toBe(ABC);
  });

  test("the layer's style holds a rule for each styled key, only that key", () => {
    expect(layer.style).toContain(`.${String(one.class)} {`);
    expect(layer.style).toContain(`.${ABC.class} { background-color: #e8792c;`);
  });
});

describe("MathLiveActionKey", () => {
  test("a key with no style of its own keeps its classes and adds no CSS", () => {
    const key = new MathLiveActionKey({ label: "x", class: "action" });

    expect(key.class).toBe("action");
    expect(key.toStyle()).toBe("");
  });

  test("two styled keys never share a style class", () => {
    const css = { color: "red" };
    const first = new MathLiveActionKey({ label: "a", css });
    const second = new MathLiveActionKey({ label: "b", css });

    expect(first.class).not.toBe(second.class);
  });
});

describe("buildMatrixLatex", () => {
  test("writes the grid as a bracketed matrix, row by row", () => {
    expect(
      buildMatrixLatex([
        ["1", "2"],
        ["3", "4"],
      ]),
    ).toBe("\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}");
  });
});
