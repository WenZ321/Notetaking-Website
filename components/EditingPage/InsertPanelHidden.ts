// Where this browser remembers whether the insert panel was hidden, which
// also decides where the editor's page sits
const HIDDEN_KEY = "insert-panel-hidden";

// The browser can refuse saved settings, then the panel just starts shown
export function readInsertPanelHidden() {
  try {
    return localStorage.getItem(HIDDEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveInsertPanelHidden(isHidden: boolean) {
  try {
    localStorage.setItem(HIDDEN_KEY, String(isHidden));
  } catch {
    // not remembered, but it still slides
  }
}
