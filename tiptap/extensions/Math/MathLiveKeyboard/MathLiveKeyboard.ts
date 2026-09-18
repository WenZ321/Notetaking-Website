import type { MathfieldElement } from "mathlive";
import { DefaultKeyboardLayout } from "./MathLiveKeyboards";

const customLayout = {
  id: "custom",
  label: "Custom",
  layers: [DefaultKeyboardLayout.layer],
  // hide the default undo/redo/paste toolbar mathlive adds to every layout
  displayEditToolbar: false,
};

// Owns mathlive's virtual keyboard singleton for one math field: mounts it
// into a container (which has a fixed CSS height sized for the default
// layout), tears it back down.
export class MathLiveKeyboard {
  private readonly mathfield: MathfieldElement;
  private showTimeout: number | undefined;

  constructor(mathfield: MathfieldElement) {
    this.mathfield = mathfield;
  }

  private get keyboard() {
    return window.mathVirtualKeyboard;
  }

  // redirect mathlive's global keyboard singleton into our container
  mount(container: HTMLElement): void {
    const keyboard = this.keyboard;

    keyboard.container = container;
    keyboard.layouts = [customLayout];
    this.mathfield.mathVirtualKeyboardPolicy = "manual";

    // deferred one tick: <math-field> needs a moment to init after mounting,
    // or focus()/show() can silently no-op
    this.showTimeout = window.setTimeout(() => {
      this.mathfield.focus();
      keyboard.show();
    }, 0);
  }

  unmount(): void {
    const keyboard = this.keyboard;

    // cancel the deferred focus/show if it hasn't fired yet
    window.clearTimeout(this.showTimeout);

    // restore the singleton so the next math field isn't left pointing here
    keyboard.hide();
    keyboard.container = document.body;
  }
}
