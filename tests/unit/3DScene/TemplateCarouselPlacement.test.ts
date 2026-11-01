import { describe, expect, test } from "vitest";
import { getNotebookPlacement } from "@/components/3DScene/TemplateCarousel/TemplateCarouselPlacement";

describe("getNotebookPlacement", () => {
  test("the middle notebooks face you, spaced evenly on both sides of the center", () => {
    const [farLeft, left, right, farRight] = [-1.5, -0.5, 0.5, 1.5].map(
      getNotebookPlacement,
    );

    expect([farLeft, left, right, farRight].every((p) => p.turn === 0)).toBe(true);
    expect(right.position[0]).toBeCloseTo(-left.position[0]);
    expect(farRight.position[0] - right.position[0]).toBeCloseTo(
      right.position[0] - left.position[0],
    );
  });

  test("side notebooks mirror each other, turned in and further back the further out they are", () => {
    const left = getNotebookPlacement(-2.5);
    const right = getNotebookPlacement(2.5);
    const furtherRight = getNotebookPlacement(3.5);

    expect(right.position[0]).toBeCloseTo(-left.position[0]);
    expect(right.turn).toBeCloseTo(-left.turn);
    expect(left.turn).toBeGreaterThan(0);
    expect(furtherRight.position[2]).toBeLessThan(right.position[2]);
    expect(furtherRight.position[0]).toBeGreaterThan(right.position[0]);
  });

  test("only two notebooks show on each side", () => {
    expect(getNotebookPlacement(3.5).isHidden).toBe(false);
    expect(getNotebookPlacement(4.5).isHidden).toBe(true);
    expect(getNotebookPlacement(-4.5).isHidden).toBe(true);
  });
});
