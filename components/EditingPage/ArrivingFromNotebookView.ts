// Whether the editor is opening from a page clicked in the notebook view,
// so its tools slide in after the zoom. It lives outside React so it lasts
// through the route change, and a fresh load or a link starts it off
let isArriving = false;

export function markArrivingFromNotebookView() {
  isArriving = true;
}

export function isArrivingFromNotebookView() {
  return isArriving;
}

export function clearArrivingFromNotebookView() {
  isArriving = false;
}
