// Where the reduced motion setting is saved in the browser
const SAVED_KEY = "erimere-reduced-motion";

// Marks the page with the saved setting, or the computer's own setting if
// nothing is saved yet. It runs on its own in the page head, so it can only
// use what it's handed, not anything else in this file
function markSavedSetting(savedKey: string) {
  let saved = null;
  try {
    saved = localStorage.getItem(savedKey);
  } catch {}
  const isReduced =
    saved === null
      ? matchMedia("(prefers-reduced-motion: reduce)").matches
      : saved === "true";
  document.documentElement.dataset.reducedMotion = String(isReduced);
}

// Runs before the page is first drawn, so no animation starts before the
// setting is known
export const REDUCED_MOTION_SCRIPT = `(${markSavedSetting})(${JSON.stringify(SAVED_KEY)});`;

// Whether animations should be skipped or swapped for fades
export function isReducedMotion(): boolean {
  return document.documentElement.dataset.reducedMotion === "true";
}

// Marks the page and saves the choice for next time
export function setReducedMotion(isReduced: boolean) {
  document.documentElement.dataset.reducedMotion = String(isReduced);
  // the browser can refuse to save, like in private windows, and then it
  // only lasts until the page reloads
  try {
    localStorage.setItem(SAVED_KEY, String(isReduced));
  } catch {}
}
