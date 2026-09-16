import type { MathfieldElement } from "mathlive";
import type { VirtualKeyboardLayer } from "mathlive";
import { PI, SQRT, SUPERSCRIPT, SUBSCRIPT } from "./MathLiveKey";
import { NormalMathLiveKeycap, WideMathLiveKeycap } from "./MathLiveKeycapTypes";
import { CLEAR } from "./MathLiveActionKey";

const superscriptKeycap = new NormalMathLiveKeycap(SUPERSCRIPT);
const subscriptKeycap = new NormalMathLiveKeycap(SUBSCRIPT);
const sqrtKeycap = new WideMathLiveKeycap(SQRT);
const piKeycap = new NormalMathLiveKeycap(PI);

const layer: VirtualKeyboardLayer = {
  rows: [
    ["7", "8", "9", "/", "(", ")"],
    ["4", "5", "6", "*", superscriptKeycap.toKeycap(), subscriptKeycap.toKeycap()],
    ["1", "2", "3", "-", sqrtKeycap.toKeycap(), piKeycap.toKeycap()],
    ["0", ".", "=", "+", CLEAR, "[return]"],
  ],
  // collect each custom keycap's own CSS into the layer's stylesheet
  style: [superscriptKeycap, subscriptKeycap, sqrtKeycap, piKeycap]
    .map((keycap) => keycap.toStyle())
    .join("\n"),
};

const customLayout = {
  id: "custom",
  label: "Custom",
  layers: [layer],
  // hide the default undo/redo/paste toolbar mathlive adds to every layout
  displayEditToolbar: false,
};

// Owns mathlive's virtual keyboard singleton for one math field: mounts it
// into a container, keeps the container sized to it, tears it back down.
export class MathLiveKeyboard {
  private readonly mathfield: MathfieldElement;
  private container: HTMLElement | null = null;
  private showTimeout: number | undefined;

  constructor(mathfield: MathfieldElement) {
    this.mathfield = mathfield;
  }

  private get keyboard() {
    return window.mathVirtualKeyboard;
  }

  private updateHeight = () => {
    // also guards against a stray event firing after unmount()
    if (!this.container) return;

    // measure the keyboard, not the (otherwise empty) container
    const height = this.keyboard.boundingRect.height;

    // can momentarily read 0 mid-transition; ignore rather than collapse
    if (height > 0) {
      this.container.style.height = `${height}px`;
    }
  };

  // redirect mathlive's global keyboard singleton into our container
  mount(container: HTMLElement): void {
    this.container = container;

    const keyboard = this.keyboard;

    keyboard.container = container;
    keyboard.layouts = [customLayout];
    this.mathfield.mathVirtualKeyboardPolicy = "manual";

    // keyboard height changes (e.g. switching layers), keep container in sync
    keyboard.addEventListener("geometrychange", this.updateHeight);

    // deferred one tick: <math-field> needs a moment to init after mounting,
    // or focus()/show() can silently no-op
    this.showTimeout = window.setTimeout(() => {
      this.mathfield.focus();
      keyboard.show();
      this.updateHeight();
    }, 0);
  }

  unmount(): void {
    const keyboard = this.keyboard;

    // cancel the deferred focus/show if it hasn't fired yet
    window.clearTimeout(this.showTimeout);
    keyboard.removeEventListener("geometrychange", this.updateHeight);

    // restore the singleton so the next math field isn't left pointing here
    keyboard.hide();
    keyboard.container = document.body;

    this.container = null;
  }
}
