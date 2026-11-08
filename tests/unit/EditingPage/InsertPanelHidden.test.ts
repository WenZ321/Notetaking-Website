import { afterEach, describe, expect, test, vi } from "vitest";
import {
  readInsertPanelHidden,
  saveInsertPanelHidden,
} from "@/components/EditingPage/InsertPanelHidden";

// A browser's saved settings, kept in memory
function makeStorage() {
  const saved = new Map<string, string>();
  return {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => saved.set(key, value),
  };
}

// A browser that refuses saved settings, like some private windows
const refusingStorage = {
  getItem: () => {
    throw new Error("refused");
  },
  setItem: () => {
    throw new Error("refused");
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the insert panel's hidden setting", () => {
  test("starts shown when nothing was saved", () => {
    vi.stubGlobal("localStorage", makeStorage());

    expect(readInsertPanelHidden()).toBe(false);
  });

  test("reads back what was saved", () => {
    vi.stubGlobal("localStorage", makeStorage());

    saveInsertPanelHidden(true);
    expect(readInsertPanelHidden()).toBe(true);
    saveInsertPanelHidden(false);
    expect(readInsertPanelHidden()).toBe(false);
  });

  test("a browser that refuses saved settings starts shown and doesn't break saving", () => {
    vi.stubGlobal("localStorage", refusingStorage);

    expect(() => saveInsertPanelHidden(true)).not.toThrow();
    expect(readInsertPanelHidden()).toBe(false);
  });
});
