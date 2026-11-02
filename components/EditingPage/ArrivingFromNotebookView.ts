import type { NotebookState } from "@/types/Notebook";

// The notebook whose page was just clicked in the notebook view, so the
// editor shows it from its first frame and its tools slide in after the
// zoom onto the page. It lives outside React so it lasts through the route
// change, and a fresh load or a link starts it off
let arrivingNotebook: NotebookState | null = null;

export function markArrivingFromNotebookView(notebook: NotebookState) {
  arrivingNotebook = notebook;
}

export function getArrivingFromNotebookView() {
  return arrivingNotebook;
}

export function clearArrivingFromNotebookView() {
  arrivingNotebook = null;
}
