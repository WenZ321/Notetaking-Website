import { afterEach, describe, expect, test, vi } from "vitest";
import { Group, Vector3 } from "three";
import {
  getEasedProgress,
  getPose,
  setPose,
} from "@/components/3DScene/TemplateCarousel/CarouselMotion";
import { COVER_MOVE_DURATION_MS } from "@/components/UserNotebooksPage/TemplateCarouselLayout";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getEasedProgress", () => {
  test("goes from 0 to 1 over one cover move, and stays at 1 after", () => {
    const change = { from: 0, to: 1, startedAt: 1000 };
    const now = vi.spyOn(performance, "now");

    now.mockReturnValue(1000);
    expect(getEasedProgress(change)).toBe(0);
    now.mockReturnValue(1000 + COVER_MOVE_DURATION_MS / 2);
    expect(getEasedProgress(change)).toBe(0.5);
    now.mockReturnValue(1000 + COVER_MOVE_DURATION_MS * 3);
    expect(getEasedProgress(change)).toBe(1);
  });
});

describe("getPose and setPose", () => {
  test("a pose read off one notebook puts another in the same place and turn", () => {
    const first = new Group();
    first.position.set(1, 2, 3);
    first.rotation.y = 0.4;
    const second = new Group();

    setPose(second, getPose(first));

    expect(second.position.toArray()).toEqual([1, 2, 3]);
    expect(second.rotation.y).toBe(0.4);
  });

  test("a read pose doesn't move when the notebook moves after", () => {
    const group = new Group();
    const pose = getPose(group);

    group.position.set(5, 5, 5);

    expect(pose.position).toEqual(new Vector3(0, 0, 0));
  });
});
