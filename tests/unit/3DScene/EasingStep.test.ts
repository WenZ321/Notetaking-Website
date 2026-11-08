import { describe, expect, test } from "vitest";
import {
  easeInOutQuart,
  getEasingStep,
} from "@/components/3DScene/EasingStep";

describe("easeInOutQuart", () => {
  test("starts at 0, ends at 1 and is halfway at the middle", () => {
    expect(easeInOutQuart(0)).toBe(0);
    expect(easeInOutQuart(0.5)).toBe(0.5);
    expect(easeInOutQuart(1)).toBe(1);
  });

  test("starts slow and settles slow, the same at both ends", () => {
    expect(easeInOutQuart(0.1)).toBeLessThan(0.1);
    expect(easeInOutQuart(0.9)).toBeGreaterThan(0.9);
    expect(easeInOutQuart(0.2)).toBeCloseTo(1 - easeInOutQuart(0.8));
  });

  test("never goes backward", () => {
    const steps = Array.from({ length: 21 }, (_, index) =>
      easeInOutQuart(index / 20),
    );
    steps.slice(1).forEach((step, index) => {
      expect(step).toBeGreaterThanOrEqual(steps[index]);
    });
  });
});

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
