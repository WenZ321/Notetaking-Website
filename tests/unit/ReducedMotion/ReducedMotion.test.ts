import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  REDUCED_MOTION_SCRIPT,
  isReducedMotion,
  setReducedMotion,
} from "@/components/ReducedMotion/ReducedMotion";

// A stand-in for the browser: the page's html element, saved settings, and
// whether the computer asks for reduced motion
let systemReduced = false;

beforeEach(() => {
  const saved = new Map<string, string>();
  vi.stubGlobal("document", { documentElement: { dataset: {} } });
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => saved.set(key, value),
  });
  vi.stubGlobal("matchMedia", () => ({ matches: systemReduced }));
  systemReduced = false;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Runs the page head script the way the browser would
function loadPage() {
  document.documentElement.dataset.reducedMotion = undefined;
  new Function(REDUCED_MOTION_SCRIPT)();
}

describe("reduced motion setting", () => {
  test("follows the computer's setting until it's changed", () => {
    systemReduced = true;
    loadPage();
    expect(isReducedMotion()).toBe(true);

    systemReduced = false;
    loadPage();
    expect(isReducedMotion()).toBe(false);
  });

  test("a saved choice wins over the computer's setting after a reload", () => {
    systemReduced = true;
    loadPage();
    setReducedMotion(false);
    expect(isReducedMotion()).toBe(false);

    loadPage();
    expect(isReducedMotion()).toBe(false);
  });

  test("still works for this visit when saving is refused", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    systemReduced = true;
    loadPage();
    expect(isReducedMotion()).toBe(true);

    setReducedMotion(false);
    expect(isReducedMotion()).toBe(false);
  });
});
