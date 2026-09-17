import type { MathfieldElement } from "mathlive";
import { DefaultKeyboardLayout } from "./MathLiveKeyboardLayout";

const customLayout = {
  id: "custom",
  label: "Custom",
  layers: [DefaultKeyboardLayout.layer],
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
