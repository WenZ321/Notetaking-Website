import type { NotebookState } from "@/types/Notebook";

// The notebook the editor was showing when it left for the notebook view,
// with what was just written on it, the page it was on, and where that
// page's paper was on screen, so the view shows the notebook from its first
// frame, zoomed onto that spot, and pulls back from it. It lives outside
// React so it lasts through the route change, and a fresh load or a link
// starts it off
type ReturningPage = {
  notebook: NotebookState;
  pageId: string;
  paperRect: DOMRect;
};

let returningPage: ReturningPage | null = null;

export function markReturningFromEditor(returning: ReturningPage) {
  returningPage = returning;
}

export function getReturningFromEditor() {
  return returningPage;
}

export function clearReturningFromEditor() {
  returningPage = null;
}
