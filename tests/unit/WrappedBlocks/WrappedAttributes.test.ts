import { describe, expect, test } from "vitest";
import {
  getWrappedBlockAttributes,
  getWrappedColumnAttributes,
  toHTMLAttributes,
  toReactProps,
} from "@/tiptap/nodes/WrappedBlock/WrappedAttributes";

describe("a wrapped block's drawn attributes", () => {
  test("say which way it wraps", () => {
    expect(
      toHTMLAttributes(getWrappedBlockAttributes({ wrap: "newspaper" })),
    ).toEqual({
      class: "wrapped-block",
      "data-type": "wrapped-block",
      "data-wrap": "newspaper",
    });
  });
});

describe("a wrapped column's drawn attributes", () => {
  test("a column with a width keeps it for parsing and hands it to the CSS", () => {
    const drawn = getWrappedColumnAttributes({ columnType: "text", width: 200 });

    expect(toHTMLAttributes(drawn)).toEqual({
      class: "wrapped-column",
      "data-type": "wrapped-column",
      "data-column-type": "text",
      "data-width": 200,
      style: "--column-width: 200px",
    });
  });

  test("a column with no width has no width and no style", () => {
    const html = toHTMLAttributes(
      getWrappedColumnAttributes({ columnType: "block", width: null }),
    );

    expect(html).not.toHaveProperty("data-width");
    expect(html).not.toHaveProperty("style");
  });

  test("the notebook view draws the same column as the editor, as a style object", () => {
    const drawn = getWrappedColumnAttributes({ columnType: "text", width: 200 });

    expect(toReactProps(drawn)).toEqual({
      className: "wrapped-column",
      "data-type": "wrapped-column",
      "data-column-type": "text",
      "data-width": 200,
      style: { "--column-width": "200px" },
    });
  });
});
