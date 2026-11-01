import { describe, expect, test } from "vitest";
import { getEasingStep } from "@/components/3DScene/EasingStep";

describe("getEasingStep", () => {
  test("a normal frame covers a share of the way, more at a higher speed", () => {
    const slow = getEasingStep(1 / 60, 10);
    const fast = getEasingStep(1 / 60, 20);

    expect(slow).toBeGreaterThan(0);
    expect(slow).toBeLessThan(1);
    expect(fast).toBeGreaterThan(slow);
  });

  test("the first frame after sitting still doesn't jump to the end", () => {
    // seconds since the last frame after the scene sat still for a while
    expect(getEasingStep(3, 15)).toBeLessThan(1);
    expect(getEasingStep(3, 15)).toBe(getEasingStep(1 / 30, 15));
  });
});
